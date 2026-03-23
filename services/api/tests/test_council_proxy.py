import httpx
from fastapi.testclient import TestClient

from clara_api.main import app

client = TestClient(app)


def _login(email: str) -> str:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": "secret"})
    assert response.status_code == 200
    return response.json()["access_token"]


def test_council_run_success(monkeypatch) -> None:
    token = _login("dr@doctor.clara")
    captured: dict[str, object] = {}
    request_payload = {"topic": "polypharmacy"}
    upstream_payload = {"ok": True, "recommendation": "Review contraindications"}

    class _MockResponse:
        status_code = 200

        @staticmethod
        def json() -> dict[str, object]:
            return upstream_payload

    def _fake_post(url: str, *, json: dict[str, object], timeout: float) -> _MockResponse:
        captured["url"] = url
        captured["json"] = json
        captured["timeout"] = timeout
        return _MockResponse()

    monkeypatch.setattr("clara_api.api.v1.endpoints.ml_proxy.httpx.post", _fake_post)

    response = client.post(
        "/api/v1/council/run",
        headers={"Authorization": f"Bearer {token}"},
        json=request_payload,
    )

    assert response.status_code == 200
    assert response.json() == upstream_payload
    assert str(captured["url"]).endswith("/v1/council/run")
    assert captured["json"] == request_payload
    assert float(captured["timeout"]) > 0


def test_council_run_returns_502_when_ml_unavailable(monkeypatch) -> None:
    token = _login("dr@doctor.clara")

    def _fake_post(_url: str, *, json: dict[str, object], timeout: float) -> object:
        raise httpx.ConnectError("connection refused")

    monkeypatch.setattr("clara_api.api.v1.endpoints.ml_proxy.httpx.post", _fake_post)

    response = client.post(
        "/api/v1/council/run",
        headers={"Authorization": f"Bearer {token}"},
        json={"topic": "polypharmacy"},
    )

    assert response.status_code == 502
    assert "ML service unavailable" in response.json()["detail"]


def test_council_run_forbidden_for_non_doctor() -> None:
    token = _login("alice@research.clara")

    response = client.post(
        "/api/v1/council/run",
        headers={"Authorization": f"Bearer {token}"},
        json={"topic": "polypharmacy"},
    )

    assert response.status_code == 403
