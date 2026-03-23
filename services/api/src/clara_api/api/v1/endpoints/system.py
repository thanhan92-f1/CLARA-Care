import httpx
from fastapi import APIRouter, Depends

from clara_api.core.config import get_settings
from clara_api.core.metrics import get_api_metrics_store
from clara_api.core.rbac import require_roles
from clara_api.core.security import TokenPayload

router = APIRouter()


@router.get("/metrics")
def get_metrics(
    _token: TokenPayload = Depends(require_roles("doctor")),
) -> dict[str, object]:
    return get_api_metrics_store().snapshot()


@router.get("/dependencies")
def get_dependencies(
    _token: TokenPayload = Depends(require_roles("doctor")),
) -> dict[str, object]:
    settings = get_settings()
    health_url = f"{settings.ml_service_url.rstrip('/')}/health"
    ml_status: dict[str, object] = {"url": health_url}

    try:
        response = httpx.get(health_url, timeout=settings.ml_service_timeout_seconds)
        ml_status["reachable"] = response.status_code < 500
        ml_status["status"] = "ok" if response.status_code < 400 else "unhealthy"
        ml_status["upstream_status_code"] = response.status_code
    except (httpx.ConnectError, httpx.NetworkError, httpx.TimeoutException) as exc:
        ml_status["reachable"] = False
        ml_status["status"] = "unreachable"
        ml_status["detail"] = f"{exc.__class__.__name__}: {exc}"
    except httpx.HTTPError as exc:
        ml_status["reachable"] = False
        ml_status["status"] = "unreachable"
        ml_status["detail"] = str(exc)

    overall_status = "ok" if ml_status.get("status") == "ok" else "degraded"
    return {"status": overall_status, "dependencies": {"ml": ml_status}}
