from typing import Any

import httpx
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from clara_api.core.config import get_settings
from clara_api.core.flow_event_store import get_flow_event_store
from clara_api.core.rbac import require_roles
from clara_api.core.security import TokenPayload
from clara_api.db.models import SystemSetting
from clara_api.db.session import get_db
from clara_api.schemas import RagFlowConfig, SystemControlTowerConfig

router = APIRouter()
CONTROL_TOWER_KEY = "control_tower_config_v1"
DEFAULT_CONTROL_TOWER = SystemControlTowerConfig(
    rag_sources=[
        {
            "id": "pubmed",
            "name": "PubMed",
            "enabled": True,
            "priority": 1,
            "weight": 1.0,
            "category": "literature",
        },
        {
            "id": "europepmc",
            "name": "Europe PMC",
            "enabled": True,
            "priority": 2,
            "weight": 1.0,
            "category": "literature",
        },
        {
            "id": "openalex",
            "name": "OpenAlex",
            "enabled": True,
            "priority": 3,
            "weight": 1.0,
            "category": "literature",
        },
        {
            "id": "crossref",
            "name": "Crossref",
            "enabled": True,
            "priority": 4,
            "weight": 1.0,
            "category": "literature",
        },
        {
            "id": "clinicaltrials",
            "name": "ClinicalTrials.gov",
            "enabled": True,
            "priority": 5,
            "weight": 1.0,
            "category": "clinical_trials",
        },
        {
            "id": "openfda",
            "name": "openFDA",
            "enabled": True,
            "priority": 6,
            "weight": 1.0,
            "category": "drug_safety",
        },
        {
            "id": "dailymed",
            "name": "DailyMed",
            "enabled": True,
            "priority": 7,
            "weight": 1.0,
            "category": "drug_label",
        },
        {
            "id": "searxng",
            "name": "SearXNG (self-host)",
            "enabled": True,
            "priority": 8,
            "weight": 1.0,
            "category": "web_search",
        },
        {
            "id": "rxnorm",
            "name": "RxNorm",
            "enabled": True,
            "priority": 9,
            "weight": 1.0,
            "category": "drug_normalization",
        },
        {
            "id": "davidrug",
            "name": "Cục Quản lý Dược (VN)",
            "enabled": True,
            "priority": 10,
            "weight": 1.0,
            "category": "vn_regulatory",
        },
    ],
    rag_flow=RagFlowConfig(
        role_router_enabled=True,
        intent_router_enabled=True,
        verification_enabled=True,
        deepseek_fallback_enabled=True,
        low_context_threshold=0.2,
        scientific_retrieval_enabled=True,
        web_retrieval_enabled=True,
        file_retrieval_enabled=True,
    ),
)


class ChatRequest(BaseModel):
    message: str


def _normalize_flow_events(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, dict):
        return [payload]
    if not isinstance(payload, list):
        return []

    normalized: list[dict[str, Any]] = []
    for index, item in enumerate(payload):
        if isinstance(item, dict):
            normalized.append(item)
            continue
        normalized.append({"type": "raw_flow_event", "index": index, "value": item})
    return normalized


def _persist_chat_flow_events(*, token: TokenPayload, role: str, ml_response: dict[str, Any]) -> None:
    raw_intent = ml_response.get("intent")
    intent = raw_intent if isinstance(raw_intent, str) and raw_intent else None
    raw_model_used = ml_response.get("model_used")
    model_used = raw_model_used if isinstance(raw_model_used, str) and raw_model_used else None

    flow_events = _normalize_flow_events(ml_response.get("flow_events"))
    store = get_flow_event_store()
    if flow_events:
        for index, flow_event in enumerate(flow_events):
            event_payload = dict(flow_event)
            event_payload.setdefault("index", index)
            store.append(
                source="chat",
                user_id=token.sub or "unknown",
                role=role,
                intent=intent,
                model_used=model_used,
                event=event_payload,
            )
        return

    store.append(
        source="chat",
        user_id=token.sub or "unknown",
        role=role,
        intent=intent,
        model_used=model_used,
        flow_events_missing=True,
        event={"type": "flow_events_missing"},
    )


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


def _load_control_tower(db: Session) -> SystemControlTowerConfig:
    row = db.execute(
        select(SystemSetting).where(SystemSetting.key == CONTROL_TOWER_KEY)
    ).scalar_one_or_none()
    if not row or not isinstance(row.value_json, dict):
        return DEFAULT_CONTROL_TOWER

    try:
        return SystemControlTowerConfig.model_validate(row.value_json)
    except Exception:
        return DEFAULT_CONTROL_TOWER


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
    control_tower = _load_control_tower(db)
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

    _persist_chat_flow_events(token=token, role=resolved_role, ml_response=ml_response)

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
