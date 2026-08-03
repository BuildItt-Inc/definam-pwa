from __future__ import annotations

import hashlib
import hmac
import json
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


# ── Helpers ────────────────────────────────────────────────────────────────


def _make_signature(payload: bytes, secret: str) -> str:
    return hmac.new(secret.encode(), payload, hashlib.sha512).hexdigest()


WEBHOOK_SECRET = "test-webhook-secret"


@pytest.fixture(autouse=True)
def mock_settings(monkeypatch):
    """Override settings for all webhook tests."""
    import app.core.security as sec
    import app.services.webhook_service as ws

    class FakeSettings:
        paystack_webhook_secret = WEBHOOK_SECRET
        app_url = "http://localhost:8000"
        frontend_url = "http://localhost:3000"
        resend_api_key = ""
        from_email = "test@definam.ng"
        smtp_host = "localhost"
        smtp_port = 25
        smtp_username = ""
        smtp_password = ""

    monkeypatch.setattr(ws, "get_settings", lambda: FakeSettings())
    monkeypatch.setattr(sec, "get_settings", lambda: FakeSettings())


# ── Signature validation ───────────────────────────────────────────────────


@pytest.mark.anyio
async def test_bad_signature_returns_400():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        payload = json.dumps({"event": "charge.success", "data": {}}).encode()
        resp = await client.post(
            "/api/v1/webhooks/paystack",
            content=payload,
            headers={
                "Content-Type": "application/json",
                "x-paystack-signature": "bad-signature",
            },
        )
    assert resp.status_code == 400


@pytest.mark.anyio
async def test_non_charge_event_acknowledged():
    payload = json.dumps({"event": "subscription.create", "data": {}}).encode()
    sig = _make_signature(payload, WEBHOOK_SECRET)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.post(
            "/api/v1/webhooks/paystack",
            content=payload,
            headers={"Content-Type": "application/json", "x-paystack-signature": sig},
        )
    assert resp.status_code == 200
    assert resp.json()["received"] is True


# ── Individual handler ─────────────────────────────────────────────────────


@pytest.mark.anyio
async def test_individual_webhook_inserts_code_and_sends_email():
    event = {
        "event": "charge.success",
        "data": {
            "reference": "ref-ind-001",
            "amount": 170_000,
            "metadata": {
                "payment_type": "individual",
                "email": "student@example.com",
            },
        },
    }
    payload = json.dumps(event).encode()
    sig = _make_signature(payload, WEBHOOK_SECRET)

    with (
        patch(
            "app.services.webhook_service.is_webhook_processed",
            new_callable=AsyncMock,
            return_value=False,
        ),
        patch(
            "app.services.webhook_service.mark_webhook_processed",
            new_callable=AsyncMock,
        ),
        patch(
            "app.services.webhook_service.insert_individual_code",
            new_callable=AsyncMock,
        ),
        patch(
            "app.services.webhook_service.send_individual_code",
            new_callable=AsyncMock,
        ) as mock_code_email,
        patch(
            "app.services.webhook_service.send_payment_receipt",
            new_callable=AsyncMock,
        ) as mock_receipt,
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.post(
                "/api/v1/webhooks/paystack",
                content=payload,
                headers={
                    "Content-Type": "application/json",
                    "x-paystack-signature": sig,
                },
            )

    assert resp.status_code == 200
    mock_code_email.assert_called_once()
    mock_receipt.assert_called_once()
    assert mock_code_email.call_args[0][0] == "student@example.com"


# ── Org handler ────────────────────────────────────────────────────────────


@pytest.mark.anyio
async def test_org_webhook_creates_org_and_sends_admin_email():
    event = {
        "event": "charge.success",
        "data": {
            "reference": "ref-org-001",
            "amount": 5 * 170_000,
            "metadata": {
                "payment_type": "org",
                "school_email": "admin@school.edu.ng",
                "school_name": "Test School",
                "student_count": 5,
            },
        },
    }
    payload = json.dumps(event).encode()
    sig = _make_signature(payload, WEBHOOK_SECRET)

    with (
        patch(
            "app.services.webhook_service.is_webhook_processed",
            new_callable=AsyncMock,
            return_value=False,
        ),
        patch(
            "app.services.webhook_service.mark_webhook_processed",
            new_callable=AsyncMock,
        ),
        patch(
            "app.services.webhook_service.get_school_by_email",
            new_callable=AsyncMock,
            return_value=None,
        ),
        patch(
            "app.services.webhook_service.get_user_by_username",
            new_callable=AsyncMock,
            return_value=None,
        ),
        patch(
            "app.services.webhook_service.create_org",
            new_callable=AsyncMock,
            return_value="org-uuid",
        ),
        patch(
            "app.services.webhook_service.bulk_insert_codes",
            new_callable=AsyncMock,
        ) as mock_bulk,
        patch(
            "app.services.webhook_service.create_student_user",
            new_callable=AsyncMock,
        ),
        patch(
            "app.services.webhook_service.send_org_admin_credentials",
            new_callable=AsyncMock,
        ) as mock_admin_email,
        patch(
            "app.services.webhook_service.send_payment_receipt",
            new_callable=AsyncMock,
        ),
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.post(
                "/api/v1/webhooks/paystack",
                content=payload,
                headers={
                    "Content-Type": "application/json",
                    "x-paystack-signature": sig,
                },
            )

    assert resp.status_code == 200
    codes_inserted = mock_bulk.call_args[0][1]
    assert len(codes_inserted) == 5
    mock_admin_email.assert_called_once()
    assert mock_admin_email.call_args[0][0] == "admin@school.edu.ng"


# ── Idempotency ────────────────────────────────────────────────────────────


@pytest.mark.anyio
async def test_duplicate_webhook_is_skipped():
    event = {
        "event": "charge.success",
        "data": {
            "reference": "ref-dup-001",
            "amount": 170_000,
            "metadata": {"payment_type": "individual", "email": "x@x.com"},
        },
    }
    payload = json.dumps(event).encode()
    sig = _make_signature(payload, WEBHOOK_SECRET)

    with (
        patch(
            "app.services.webhook_service.is_webhook_processed",
            new_callable=AsyncMock,
            return_value=True,
        ),
        patch(
            "app.services.webhook_service.send_individual_code",
            new_callable=AsyncMock,
        ) as mock_email,
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.post(
                "/api/v1/webhooks/paystack",
                content=payload,
                headers={
                    "Content-Type": "application/json",
                    "x-paystack-signature": sig,
                },
            )

    assert resp.status_code == 200
    mock_email.assert_not_called()
