from fastapi import APIRouter, Depends
from pydantic import BaseModel

from clara_api.core.rbac import require_roles
from clara_api.core.security import TokenPayload

router = APIRouter()


class ChatRequest(BaseModel):
    message: str


@router.post("/")
def chat_placeholder(
    payload: ChatRequest,
    _token: TokenPayload = Depends(require_roles("normal", "researcher", "doctor")),
) -> dict[str, str]:
    return {
        "message": payload.message,
        "reply": "[P0 placeholder] CLARA sẽ trả lời qua pipeline RAG ở giai đoạn tích hợp.",
    }
