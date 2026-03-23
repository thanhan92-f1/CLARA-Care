import httpx
from fastapi.testclient import TestClient

from clara_api.main import app

client = TestClient(app)


def _login(email: str) -> str:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": "secret"})
    assert response.status_code == 200
    return response.json()["access_token"]


def test_system_metrics_success_for_doctor() -> None:
    token = _login("dr@doctor.clara")
    warmup_response = client.get("/api/v1/health")
    assert warmup_response.status_code == 200

    response = client.get(
        "/api/v1/system/metrics",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["requests_total"] >= 1
    assert isinstance(payload["by_route"], dict)
    assert isinstance(payload["by_status"], dict)
    assert isinstance(payload["avg_latency_ms"], float)


def test_system_metrics_forbidden_for_non_doctor() -> None:
    token = _login("alice@research.clara")

    response = client.get(
        "/api/v1/system/metrics",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_system_dependencies_success(monkeypatch) -> None:
    token = _login("dr@doctor.clara")

    class _MockResponse:
        status_code = 200

    def _fake_get(url: str, *, timeout: float) -> _MockResponse:
        assert url.endswith("/health")
        assert timeout > 0
        return _MockResponse()

    monkeypatch.setattr("clara_api.api.v1.endpoints.system.httpx.get", _fake_get)

    response = client.get(
        "/api/v1/system/dependencies",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["dependencies"]["ml"]["status"] == "ok"
    assert payload["dependencies"]["ml"]["reachable"] is True
    assert payload["dependencies"]["ml"]["upstream_status_code"] == 200


def test_system_dependencies_handles_ml_unavailable(monkeypatch) -> None:
    token = _login("dr@doctor.clara")

    def _fake_get(_url: str, *, timeout: float) -> object:
        raise httpx.ConnectError("connection refused")

    monkeypatch.setattr("clara_api.api.v1.endpoints.system.httpx.get", _fake_get)

    response = client.get(
        "/api/v1/system/dependencies",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "degraded"
    assert payload["dependencies"]["ml"]["status"] == "unreachable"
    assert payload["dependencies"]["ml"]["reachable"] is False
    assert "ConnectError" in payload["dependencies"]["ml"]["detail"]
