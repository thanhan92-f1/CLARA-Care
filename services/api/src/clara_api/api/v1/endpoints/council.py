from typing import Any

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from clara_api.api.v1.endpoints.ml_proxy import proxy_ml_post
from clara_api.core.config import get_settings
from clara_api.core.rbac import require_roles
from clara_api.core.security import TokenPayload

router = APIRouter()


@router.post("/run")
def council_run(
    payload: dict[str, Any],
    _token: TokenPayload = Depends(require_roles("doctor")),
) -> dict[str, Any]:
    return proxy_ml_post("/v1/council/run", payload)


@router.post("/intake")
async def council_intake(
    transcript: str = Form(default=""),
    audio_file: UploadFile | None = File(default=None),
    _token: TokenPayload = Depends(require_roles("doctor")),
) -> dict[str, Any]:
    transcript_text = transcript.strip()
    audio_bytes: bytes | None = None
    audio_filename = "audio-input"
    audio_content_type = "application/octet-stream"

    if audio_file is not None and audio_file.filename:
        uploaded_bytes = await audio_file.read()
        if uploaded_bytes:
            audio_bytes = uploaded_bytes
            audio_filename = audio_file.filename or audio_filename
            audio_content_type = audio_file.content_type or audio_content_type

    if not transcript_text and not audio_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either transcript or audio_file is required.",
        )

    settings = get_settings()
    url = f"{settings.ml_service_url.rstrip('/')}/v1/council/intake"

    data: dict[str, str] = {"transcript": transcript_text}
    files: dict[str, tuple[str, bytes, str]] | None = None
    if audio_bytes:
        files = {
            "audio_file": (
                audio_filename,
                audio_bytes,
                audio_content_type,
            )
        }

    response: httpx.Response | None = None
    try:
        response = httpx.post(
            url,
            data=data,
            files=files,
            timeout=settings.ml_service_timeout_seconds,
        )
    except (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError, httpx.HTTPError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"ML service unavailable: {exc.__class__.__name__}",
        ) from exc

    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"ML service upstream error: status={response.status_code}",
        )

    try:
        payload = response.json()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="ML service returned invalid JSON",
        ) from exc

    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="ML service returned unexpected payload format",
        )

    return payload
