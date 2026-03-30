from uuid import uuid4

from fastapi.testclient import TestClient

from clara_api.core.config import get_settings
from clara_api.core.login_guard import login_guard
from clara_api.main import app

client = TestClient(app)


def _reset_runtime_state() -> None:
    get_settings.cache_clear()
    login_guard._states.clear()  # noqa: SLF001


def test_refresh_token_is_single_use(monkeypatch) -> None:
    monkeypatch.setenv("AUTH_REQUIRE_EMAIL_VERIFICATION", "false")
    _reset_runtime_state()

    email = f"refresh-{uuid4().hex[:8]}@example.com"
    password = "secret123"

    register_response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Refresh User", "role": "normal"},
    )
    assert register_response.status_code == 200

    login_response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert login_response.status_code == 200
    raw_refresh_token = login_response.json()["refresh_token"]
    assert raw_refresh_token

    first_refresh = client.post("/api/v1/auth/refresh", json={"refresh_token": raw_refresh_token})
    assert first_refresh.status_code == 200
    assert first_refresh.json()["refresh_token"]

    second_refresh = client.post("/api/v1/auth/refresh", json={"refresh_token": raw_refresh_token})
    assert second_refresh.status_code == 401
    _reset_runtime_state()


def test_login_lock_after_repeated_failures(monkeypatch) -> None:
    monkeypatch.setenv("AUTH_REQUIRE_EMAIL_VERIFICATION", "false")
    monkeypatch.setenv("AUTH_LOGIN_ATTEMPT_LIMIT", "3")
    monkeypatch.setenv("AUTH_LOGIN_WINDOW_SECONDS", "120")
    monkeypatch.setenv("AUTH_LOGIN_LOCK_SECONDS", "120")
    _reset_runtime_state()

    email = f"guard-{uuid4().hex[:8]}@example.com"
    password = "secret123"

    register_response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Guard User", "role": "normal"},
    )
    assert register_response.status_code == 200

    for _ in range(3):
        failed = client.post(
            "/api/v1/auth/login",
            headers={"x-forwarded-for": "203.0.113.1"},
            json={"email": email, "password": "wrong-password"},
        )
        assert failed.status_code == 401

    blocked = client.post(
        "/api/v1/auth/login",
        headers={"x-forwarded-for": "203.0.113.1"},
        json={"email": email, "password": password},
    )
    assert blocked.status_code == 429
    _reset_runtime_state()


def test_register_role_override_blocked_in_production(monkeypatch) -> None:
    monkeypatch.setenv("ENVIRONMENT", "production")
    _reset_runtime_state()

    email = f"doctor-{uuid4().hex[:8]}@example.com"
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "secret123",
            "full_name": "Doctor Candidate",
            "role": "doctor",
        },
    )
    assert response.status_code == 403
    _reset_runtime_state()
