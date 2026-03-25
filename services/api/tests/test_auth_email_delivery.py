from uuid import uuid4

from fastapi.testclient import TestClient

from clara_api.core.config import get_settings
from clara_api.main import app

client = TestClient(app)


def _clear_settings_cache() -> None:
    get_settings.cache_clear()


def test_register_requires_email_verification_and_resend(monkeypatch) -> None:
    monkeypatch.setenv("AUTH_REQUIRE_EMAIL_VERIFICATION", "true")
    monkeypatch.setenv("AUTH_EMAIL_DELIVERY_MODE", "preview")
    monkeypatch.setenv("AUTH_EXPOSE_ACTION_TOKEN_PREVIEW", "true")
    _clear_settings_cache()

    email = f"verify-{uuid4().hex[:8]}@example.com"
    password = "secret123"

    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": "Verify User",
            "role": "normal",
        },
    )
    assert register_response.status_code == 200
    register_payload = register_response.json()
    assert register_payload["is_email_verified"] is False
    assert register_payload["email_delivery_status"] == "preview"
    assert register_payload["verification_token_preview"]

    blocked_login = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert blocked_login.status_code == 403

    resend_response = client.post("/api/v1/auth/resend-verification", json={"email": email})
    assert resend_response.status_code == 200
    resend_payload = resend_response.json()
    assert resend_payload["accepted"] is True
    assert resend_payload["email_delivery_status"] == "preview"
    token = resend_payload["verification_token_preview"]
    assert token

    verify_response = client.post("/api/v1/auth/verify-email", json={"token": token})
    assert verify_response.status_code == 200
    assert verify_response.json()["verified"] is True

    login_response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert login_response.status_code == 200
    assert login_response.json()["access_token"]
    _clear_settings_cache()


def test_forgot_password_smtp_mode_hides_token(monkeypatch) -> None:
    monkeypatch.setenv("AUTH_REQUIRE_EMAIL_VERIFICATION", "false")
    monkeypatch.setenv("AUTH_EMAIL_DELIVERY_MODE", "smtp")
    monkeypatch.setenv("AUTH_EXPOSE_ACTION_TOKEN_PREVIEW", "false")
    _clear_settings_cache()

    monkeypatch.setattr(
        "clara_api.core.auth_email._send_via_smtp",
        lambda settings, *, recipient, subject, body: "sent",
    )

    email = f"smtp-{uuid4().hex[:8]}@example.com"
    password = "secret123"

    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": "SMTP User",
            "role": "normal",
        },
    )
    assert register_response.status_code == 200

    forgot_response = client.post("/api/v1/auth/forgot-password", json={"email": email})
    assert forgot_response.status_code == 200
    payload = forgot_response.json()
    assert payload["accepted"] is True
    assert payload["email_delivery_status"] == "sent"
    assert payload["reset_token_preview"] is None
    _clear_settings_cache()
