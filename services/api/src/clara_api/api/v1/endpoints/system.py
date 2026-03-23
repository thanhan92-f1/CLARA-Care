from datetime import UTC, datetime, timedelta

import httpx
from fastapi import APIRouter, Depends

from clara_api.core.config import get_settings
from clara_api.core.metrics import get_api_metrics_store
from clara_api.core.rbac import require_roles
from clara_api.core.security import TokenPayload

router = APIRouter()


def _utc_now_iso() -> str:
    return datetime.now(tz=UTC).isoformat()


def _utc_ago_iso(*, minutes: int = 0, hours: int = 0) -> str:
    return (datetime.now(tz=UTC) - timedelta(minutes=minutes, hours=hours)).isoformat()


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


@router.get("/ecosystem")
def get_ecosystem(
    _token: TokenPayload = Depends(require_roles("doctor")),
) -> dict[str, object]:
    generated_at = _utc_now_iso()
    partner_health: list[dict[str, object]] = [
        {
            "partner": "ehr_core",
            "status": "ok",
            "latency_ms": 118,
            "error_rate_pct": 0.2,
            "last_check": _utc_ago_iso(minutes=2),
        },
        {
            "partner": "claims_exchange",
            "status": "degraded",
            "latency_ms": 426,
            "error_rate_pct": 3.7,
            "last_check": _utc_ago_iso(minutes=3),
        },
        {
            "partner": "labs_federation",
            "status": "down",
            "latency_ms": 0,
            "error_rate_pct": 100.0,
            "last_check": _utc_ago_iso(minutes=1),
        },
    ]
    data_trust_scores: list[dict[str, object]] = [
        {
            "source": "national_hospital_feed",
            "trust_score": 92,
            "freshness_hours": 2.0,
            "drift_risk": "low",
            "last_refresh": _utc_ago_iso(hours=2),
        },
        {
            "source": "regional_outpatient_registry",
            "trust_score": 74,
            "freshness_hours": 6.5,
            "drift_risk": "medium",
            "last_refresh": _utc_ago_iso(hours=6),
        },
        {
            "source": "community_lab_batch",
            "trust_score": 48,
            "freshness_hours": 18.0,
            "drift_risk": "high",
            "last_refresh": _utc_ago_iso(hours=18),
        },
    ]
    federation_alerts: list[dict[str, object]] = [
        {
            "id": "fa-1001",
            "severity": "warning",
            "message": "Claims partner latency elevated above SLO for 15 minutes.",
            "source": "claims_exchange",
            "created_at": _utc_ago_iso(minutes=17),
            "acknowledged": True,
        },
        {
            "id": "fa-1002",
            "severity": "critical",
            "message": "Lab federation endpoint unreachable from two regions.",
            "source": "labs_federation",
            "created_at": _utc_ago_iso(minutes=7),
            "acknowledged": False,
        },
        {
            "id": "fa-1003",
            "severity": "info",
            "message": "Nightly trust model refresh completed successfully.",
            "source": "trust_scoring_pipeline",
            "created_at": _utc_ago_iso(minutes=4),
            "acknowledged": True,
        },
    ]

    summary = {
        "partners_total": len(partner_health),
        "partners_down": sum(1 for partner in partner_health if partner["status"] == "down"),
        "trust_low_count": sum(1 for score in data_trust_scores if int(score["trust_score"]) < 60),
        "critical_alert_count": sum(
            1 for alert in federation_alerts if alert["severity"] == "critical"
        ),
    }

    return {
        "generated_at": generated_at,
        "partner_health": partner_health,
        "data_trust_scores": data_trust_scores,
        "federation_alerts": federation_alerts,
        "summary": summary,
    }
