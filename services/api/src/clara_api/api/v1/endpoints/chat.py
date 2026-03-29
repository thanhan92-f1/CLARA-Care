from typing import Any

import httpx
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from clara_api.core.config import get_settings
from clara_api.core.control_tower import get_control_tower_config_service
from clara_api.core.flow import get_chat_flow_event_persister
from clara_api.core.rbac import require_roles
from clara_api.core.security import TokenPayload
from clara_api.db.session import get_db
from clara_api.schemas import RagFlowConfig

router = APIRouter()


class ChatRequest(BaseModel):
    message: str


def _safe_chat_fallback(message: str, role: str, reason: str) -> dict[str, Any]:
    return {
        "role": role,
        "intent": "general_guidance",
        "confidence": 0.35,
        "emergency": False,
        "answer": (
            "Hệ thống đang quá tải tạm thời nên câu trả lời chi tiết chưa sẵn sàng. "
            "Bạn có thể thử lại sau ít phút. Trong thời gian chờ, hãy ưu tiên nguồn chính thống "
            "và liên hệ chuyên gia y tế nếu có dấu hiệu nặng hoặc bất thường."
        ),
        "retrieved_ids": [],
        "model_used": "api-safe-fallback-v1",
        "fallback_reason": reason,
        "query_echo": message,
    }


def _call_ml_service(
    message: str,
    role: str,
    rag_flow: RagFlowConfig,
    rag_sources: list[dict[str, Any]],
) -> dict[str, Any]:
    settings = get_settings()
    url = f"{settings.ml_service_url.rstrip('/')}/v1/chat/routed"
    request_payload = {
        "query": message,
        "role": role,
        "rag_flow": rag_flow.model_dump(),
        "rag_sources": rag_sources,
    }

    try:
        response = httpx.post(
            url, json=request_payload, timeout=settings.ml_service_timeout_seconds
        )
    except (httpx.ConnectError, httpx.NetworkError, httpx.TimeoutException) as exc:
        return _safe_chat_fallback(message, role, reason=f"ml_unavailable:{exc.__class__.__name__}")
    except httpx.HTTPError as exc:
        return _safe_chat_fallback(message, role, reason=f"ml_http_error:{exc.__class__.__name__}")

    if response.status_code >= 500:
        return _safe_chat_fallback(message, role, reason=f"ml_upstream_5xx:{response.status_code}")
    if response.status_code >= 400:
        return _safe_chat_fallback(message, role, reason=f"ml_upstream_4xx:{response.status_code}")

    try:
        data = response.json()
    except ValueError as exc:
        return _safe_chat_fallback(
            message, role, reason=f"ml_invalid_json:{exc.__class__.__name__}"
        )

    if not isinstance(data, dict):
        return _safe_chat_fallback(message, role, reason="ml_unexpected_payload")

    return data


@router.post("/")
@router.post("")
def chat_placeholder(
    payload: ChatRequest,
    token: TokenPayload = Depends(require_roles("normal", "researcher", "doctor", "admin")),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    control_tower = get_control_tower_config_service().load(db)
    rag_flow = control_tower.rag_flow
    rag_sources = [item.model_dump() for item in control_tower.rag_sources]
    ml_response = _call_ml_service(payload.message, token.role, rag_flow, rag_sources)

    reply = ml_response.get("answer")
    if not isinstance(reply, str):
        reply = _safe_chat_fallback(
            payload.message,
            token.role,
            reason="ml_unexpected_payload:missing_answer",
        )["answer"]
    elif not reply.strip():
        reply = _safe_chat_fallback(
            payload.message,
            token.role,
            reason="ml_unexpected_payload:blank_answer",
        )["answer"]

    resolved_role = ml_response.get("role")
    if not isinstance(resolved_role, str) or not resolved_role:
        resolved_role = token.role

    get_chat_flow_event_persister().persist(
        token=token,
        role=resolved_role,
        ml_response=ml_response,
    )

    return {
        "message": payload.message,
        "reply": reply,
        "role": resolved_role,
        "intent": ml_response.get("intent"),
        "confidence": ml_response.get("confidence"),
        "emergency": ml_response.get("emergency"),
        "model_used": ml_response.get("model_used"),
        "retrieved_ids": ml_response.get("retrieved_ids", []),
        "ml": ml_response,
    }
