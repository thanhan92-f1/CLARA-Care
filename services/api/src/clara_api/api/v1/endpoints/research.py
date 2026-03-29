import math
from datetime import UTC, datetime
from threading import Lock
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from clara_api.api.v1.endpoints.ml_proxy import proxy_ml_post
from clara_api.core.rbac import require_roles
from clara_api.core.security import TokenPayload
from clara_api.db.models import KnowledgeDocument, KnowledgeSource, User
from clara_api.db.session import get_db
from clara_api.schemas import (
    KnowledgeDocumentResponse,
    KnowledgeDocumentUpdateRequest,
    KnowledgeSourceCreateRequest,
    KnowledgeSourceResponse,
    KnowledgeSourceUpdateRequest,
)

router = APIRouter()

_MAX_RESEARCH_UPLOADS = 200
_PREVIEW_CHAR_LIMIT = 500
_DEFAULT_SOURCE_NAME = "General Uploads"
_TEXT_FILE_EXTENSIONS = {
    ".csv",
    ".json",
    ".log",
    ".md",
    ".txt",
    ".xml",
    ".yaml",
    ".yml",
}
_IMAGE_FILE_EXTENSIONS = {".bmp", ".gif", ".jpeg", ".jpg", ".png", ".tif", ".tiff", ".webp"}

_uploaded_research_files: dict[str, dict[str, Any]] = {}
_uploaded_research_lock = Lock()


def _guess_extension(filename: str) -> str:
    if "." not in filename:
        return ""
    return f".{filename.rsplit('.', 1)[-1].lower()}"


def _is_text_file(filename: str, content_type: str) -> bool:
    extension = _guess_extension(filename)
    if content_type.startswith("text/"):
        return True
    if extension in _TEXT_FILE_EXTENSIONS:
        return True
    return content_type in {"application/json", "application/xml"}


def _is_image_file(filename: str, content_type: str) -> bool:
    if content_type.startswith("image/"):
        return True
    return _guess_extension(filename) in _IMAGE_FILE_EXTENSIONS


def _is_pdf_file(filename: str, content_type: str) -> bool:
    return content_type == "application/pdf" or _guess_extension(filename) == ".pdf"


def _extract_basic_text(file_bytes: bytes, filename: str, content_type: str) -> tuple[str, str]:
    if _is_text_file(filename, content_type):
        try:
            text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            text = file_bytes.decode("utf-8", errors="replace")
        return text, "text"

    if _is_pdf_file(filename, content_type):
        return "PDF đã được tải lên. Hệ thống chưa hỗ trợ parse sâu cho định dạng này.", "pdf"

    if _is_image_file(filename, content_type):
        return "Ảnh đã được tải lên. Hệ thống chưa hỗ trợ parse sâu cho định dạng này.", "image"

    return "File đã được tải lên. Hệ thống chưa hỗ trợ parse sâu cho định dạng này.", "other"


def _approx_token_count(text: str) -> int:
    stripped = text.strip()
    if not stripped:
        return 0
    return max(1, math.ceil(len(stripped) / 4))


def _store_uploaded_file(entry: dict[str, Any]) -> None:
    with _uploaded_research_lock:
        _uploaded_research_files[entry["file_id"]] = entry
        if len(_uploaded_research_files) <= _MAX_RESEARCH_UPLOADS:
            return

        oldest_file_id = min(
            _uploaded_research_files,
            key=lambda item_file_id: str(_uploaded_research_files[item_file_id]["created_at"]),
        )
        _uploaded_research_files.pop(oldest_file_id, None)


def _build_uploaded_documents(uploaded_file_ids: Any) -> list[dict[str, Any]]:
    if not isinstance(uploaded_file_ids, list):
        return []

    documents: list[dict[str, Any]] = []
    with _uploaded_research_lock:
        for raw_file_id in uploaded_file_ids:
            if not isinstance(raw_file_id, str):
                continue
            cached = _uploaded_research_files.get(raw_file_id)
            if not cached:
                continue

            documents.append(
                {
                    "file_id": raw_file_id,
                    "filename": cached["filename"],
                    "content_type": cached["content_type"],
                    "size": cached["size"],
                    "created_at": cached["created_at"],
                    "text": cached["text"],
                    "preview": cached["preview"],
                    "token_count": cached["token_count"],
                }
            )
    return documents


def _serialize_knowledge_document(document: KnowledgeDocument) -> KnowledgeDocumentResponse:
    return KnowledgeDocumentResponse(
        id=document.id,
        source_id=document.source_id,
        filename=document.filename,
        content_type=document.content_type,
        size=document.size,
        preview=document.preview,
        token_count=document.token_count,
        is_active=document.is_active,
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


def _serialize_knowledge_source(
    source: KnowledgeSource,
    *,
    documents_count: int,
) -> KnowledgeSourceResponse:
    return KnowledgeSourceResponse(
        id=source.id,
        name=source.name,
        description=source.description,
        is_active=source.is_active,
        created_at=source.created_at,
        updated_at=source.updated_at,
        documents_count=documents_count,
    )


def _get_user_by_token(db: Session, token: TokenPayload) -> User:
    user = db.execute(select(User).where(User.email == token.sub)).scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Người dùng không tồn tại"
        )
    return user


def _get_owned_source(db: Session, *, source_id: int, owner_user_id: int) -> KnowledgeSource:
    source = db.execute(
        select(KnowledgeSource).where(
            KnowledgeSource.id == source_id,
            KnowledgeSource.owner_user_id == owner_user_id,
        )
    ).scalar_one_or_none()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Knowledge source không tồn tại"
        )
    return source


def _get_owned_document(db: Session, *, document_id: int, owner_user_id: int) -> KnowledgeDocument:
    document = db.execute(
        select(KnowledgeDocument).where(
            KnowledgeDocument.id == document_id,
            KnowledgeDocument.owner_user_id == owner_user_id,
        )
    ).scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document không tồn tại")
    return document


def _get_or_create_default_source(db: Session, owner_user_id: int) -> KnowledgeSource:
    source = db.execute(
        select(KnowledgeSource).where(
            KnowledgeSource.owner_user_id == owner_user_id,
            KnowledgeSource.name == _DEFAULT_SOURCE_NAME,
        )
    ).scalar_one_or_none()
    if source:
        return source

    source = KnowledgeSource(
        owner_user_id=owner_user_id,
        name=_DEFAULT_SOURCE_NAME,
        description="Nguồn mặc định cho upload nhanh từ màn hình chat/research",
        is_active=True,
    )
    db.add(source)
    db.commit()
    db.refresh(source)
    return source


def _build_source_documents(
    db: Session,
    *,
    owner_user_id: int,
    source_ids: list[int],
) -> list[dict[str, Any]]:
    if not source_ids:
        return []

    source_ids_set = sorted(set(source_ids))
    source_rows = (
        db.execute(
            select(KnowledgeSource.id).where(
                KnowledgeSource.owner_user_id == owner_user_id,
                KnowledgeSource.id.in_(source_ids_set),
                KnowledgeSource.is_active.is_(True),
            )
        )
        .scalars()
        .all()
    )
    valid_source_ids = set(source_rows)
    if not valid_source_ids:
        return []

    documents = (
        db.execute(
            select(KnowledgeDocument).where(
                KnowledgeDocument.owner_user_id == owner_user_id,
                KnowledgeDocument.source_id.in_(sorted(valid_source_ids)),
                KnowledgeDocument.is_active.is_(True),
            )
        )
        .scalars()
        .all()
    )

    return [
        {
            "file_id": f"knowledge-doc-{document.id}",
            "filename": document.filename,
            "content_type": document.content_type,
            "size": document.size,
            "created_at": document.created_at.isoformat(),
            "text": document.extracted_text,
            "preview": document.preview,
            "token_count": document.token_count,
            "source": f"knowledge-source-{document.source_id}",
        }
        for document in documents
    ]


def _extract_source_ids(payload: dict[str, Any]) -> list[int]:
    raw_sources: list[Any] = []
    for key in ("source_ids", "knowledge_source_ids"):
        value = payload.get(key)
        if isinstance(value, list):
            raw_sources.extend(value)

    parsed: list[int] = []
    for item in raw_sources:
        if isinstance(item, int):
            parsed.append(item)
            continue
        if isinstance(item, str) and item.strip().isdigit():
            parsed.append(int(item.strip()))
    return parsed


def _research_tier2_fallback_payload(payload: dict[str, Any]) -> dict[str, Any]:
    fallback_answer = (
        "Hệ thống truy xuất chuyên sâu đang bận hoặc tạm thời không kết nối được nguồn RAG. "
        "Tạm thời dùng chế độ an toàn: bạn nên ưu tiên phác đồ chính thống, đối chiếu tương tác thuốc quan trọng, "
        "và trao đổi bác sĩ khi có bệnh nền hoặc dấu hiệu nặng."
    )
    return {
        "answer": fallback_answer,
        "summary": fallback_answer,
        "metadata": {},
        "citations": [],
        "fallback": True,
        "source_mode": payload.get("source_mode"),
    }


@router.get("/knowledge-sources")
def list_knowledge_sources(
    token: TokenPayload = Depends(require_roles("normal", "researcher", "doctor", "admin")),
    db: Session = Depends(get_db),
) -> dict[str, list[KnowledgeSourceResponse]]:
    user = _get_user_by_token(db, token)
    sources = (
        db.execute(
            select(KnowledgeSource)
            .where(KnowledgeSource.owner_user_id == user.id)
            .order_by(KnowledgeSource.updated_at.desc())
        )
        .scalars()
        .all()
    )

    counts_rows = db.execute(
        select(KnowledgeDocument.source_id, func.count(KnowledgeDocument.id))
        .where(KnowledgeDocument.owner_user_id == user.id)
        .group_by(KnowledgeDocument.source_id)
    ).all()
    count_by_source = {int(source_id): int(total) for source_id, total in counts_rows}

    return {
        "items": [
            _serialize_knowledge_source(
                source,
                documents_count=count_by_source.get(source.id, 0),
            )
            for source in sources
        ]
    }


@router.post("/knowledge-sources")
def create_knowledge_source(
    payload: KnowledgeSourceCreateRequest,
    token: TokenPayload = Depends(require_roles("normal", "researcher", "doctor", "admin")),
    db: Session = Depends(get_db),
) -> KnowledgeSourceResponse:
    user = _get_user_by_token(db, token)
    source = KnowledgeSource(
        owner_user_id=user.id,
        name=payload.name.strip(),
        description=payload.description.strip(),
        is_active=True,
    )
    db.add(source)
    db.commit()
    db.refresh(source)
    return _serialize_knowledge_source(source, documents_count=0)


@router.patch("/knowledge-sources/{source_id}")
def update_knowledge_source(
    source_id: int,
    payload: KnowledgeSourceUpdateRequest,
    token: TokenPayload = Depends(require_roles("normal", "researcher", "doctor", "admin")),
    db: Session = Depends(get_db),
) -> KnowledgeSourceResponse:
    user = _get_user_by_token(db, token)
    source = _get_owned_source(db, source_id=source_id, owner_user_id=user.id)

    if payload.name is not None:
        source.name = payload.name.strip()
    if payload.description is not None:
        source.description = payload.description.strip()
    if payload.is_active is not None:
        source.is_active = payload.is_active

    db.add(source)
    db.commit()
    db.refresh(source)

    documents_count = db.execute(
        select(func.count(KnowledgeDocument.id)).where(
            KnowledgeDocument.source_id == source.id,
            KnowledgeDocument.owner_user_id == user.id,
        )
    ).scalar_one()

    return _serialize_knowledge_source(source, documents_count=int(documents_count or 0))


@router.delete("/knowledge-sources/{source_id}")
def delete_knowledge_source(
    source_id: int,
    token: TokenPayload = Depends(require_roles("normal", "researcher", "doctor", "admin")),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    user = _get_user_by_token(db, token)
    source = _get_owned_source(db, source_id=source_id, owner_user_id=user.id)
    db.delete(source)
    db.commit()
    return {"deleted": True}


@router.get("/knowledge-sources/{source_id}/documents")
def list_knowledge_documents(
    source_id: int,
    token: TokenPayload = Depends(require_roles("normal", "researcher", "doctor", "admin")),
    db: Session = Depends(get_db),
) -> dict[str, list[KnowledgeDocumentResponse]]:
    user = _get_user_by_token(db, token)
    _get_owned_source(db, source_id=source_id, owner_user_id=user.id)
    documents = (
        db.execute(
            select(KnowledgeDocument)
            .where(
                KnowledgeDocument.source_id == source_id,
                KnowledgeDocument.owner_user_id == user.id,
            )
            .order_by(KnowledgeDocument.created_at.desc())
        )
        .scalars()
        .all()
    )

    return {"items": [_serialize_knowledge_document(item) for item in documents]}


@router.post("/knowledge-sources/{source_id}/upload-file")
async def upload_file_to_knowledge_source(
    source_id: int,
    file: UploadFile = File(...),
    token: TokenPayload = Depends(require_roles("normal", "researcher", "doctor", "admin")),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    user = _get_user_by_token(db, token)
    source = _get_owned_source(db, source_id=source_id, owner_user_id=user.id)

    file_name = file.filename or "uploaded-file"
    content_type = file.content_type or "application/octet-stream"
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File upload rỗng")

    extracted_text, file_kind = _extract_basic_text(file_bytes, file_name, content_type)
    preview = extracted_text[:_PREVIEW_CHAR_LIMIT]
    token_count = _approx_token_count(extracted_text if file_kind == "text" else "")

    document = KnowledgeDocument(
        source_id=source.id,
        owner_user_id=user.id,
        filename=file_name,
        content_type=content_type,
        size=len(file_bytes),
        extracted_text=extracted_text if file_kind == "text" else "",
        preview=preview,
        token_count=token_count,
        is_active=True,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    return {
        "document": _serialize_knowledge_document(document),
        "source_id": source.id,
    }


@router.patch("/documents/{document_id}")
def update_knowledge_document(
    document_id: int,
    payload: KnowledgeDocumentUpdateRequest,
    token: TokenPayload = Depends(require_roles("normal", "researcher", "doctor", "admin")),
    db: Session = Depends(get_db),
) -> KnowledgeDocumentResponse:
    user = _get_user_by_token(db, token)
    document = _get_owned_document(db, document_id=document_id, owner_user_id=user.id)
    document.is_active = payload.is_active
    db.add(document)
    db.commit()
    db.refresh(document)
    return _serialize_knowledge_document(document)


@router.post("/upload-file")
async def upload_research_file(
    file: UploadFile = File(...),
    token: TokenPayload = Depends(require_roles("normal", "researcher", "doctor", "admin")),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    user = _get_user_by_token(db, token)

    file_name = file.filename or "uploaded-file"
    content_type = file.content_type or "application/octet-stream"
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File upload rỗng")

    extracted_text, file_kind = _extract_basic_text(file_bytes, file_name, content_type)
    preview = extracted_text[:_PREVIEW_CHAR_LIMIT]
    token_count = _approx_token_count(extracted_text if file_kind == "text" else "")
    created_at = datetime.now(tz=UTC).isoformat()
    file_id = str(uuid4())

    _store_uploaded_file(
        {
            "file_id": file_id,
            "filename": file_name,
            "content_type": content_type,
            "size": len(file_bytes),
            "created_at": created_at,
            "text": extracted_text if file_kind == "text" else "",
            "preview": preview,
            "token_count": token_count,
        }
    )

    default_source = _get_or_create_default_source(db, user.id)
    document = KnowledgeDocument(
        source_id=default_source.id,
        owner_user_id=user.id,
        filename=file_name,
        content_type=content_type,
        size=len(file_bytes),
        extracted_text=extracted_text if file_kind == "text" else "",
        preview=preview,
        token_count=token_count,
        is_active=True,
    )
    db.add(document)
    db.commit()

    return {
        "file_id": file_id,
        "preview": preview,
        "token_count": token_count,
        "metadata": {
            "filename": file_name,
            "size": len(file_bytes),
            "created_at": created_at,
            "knowledge_source_id": default_source.id,
        },
    }


@router.post("/tier2")
def research_tier2(
    payload: dict[str, Any],
    token: TokenPayload = Depends(require_roles("normal", "researcher", "doctor", "admin")),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    user = _get_user_by_token(db, token)

    upstream_payload = dict(payload)
    transient_documents = _build_uploaded_documents(payload.get("uploaded_file_ids"))
    source_ids = _extract_source_ids(payload)
    source_documents = _build_source_documents(db, owner_user_id=user.id, source_ids=source_ids)
    uploaded_documents = [*transient_documents, *source_documents]

    if uploaded_documents or payload.get("source_mode") in {"uploaded_files", "knowledge_sources"}:
        upstream_payload["uploaded_documents"] = uploaded_documents
    upstream_payload["role"] = token.role

    return proxy_ml_post(
        "/v1/research/tier2",
        upstream_payload,
        fail_soft_payload=_research_tier2_fallback_payload(payload),
    )
