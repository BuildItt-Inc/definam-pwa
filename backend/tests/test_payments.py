"""Regression tests for the payment verification flow.

Guards:
- verify_payment() must NOT mutate access code status.
- For individual payments, when no code exists yet, returns 'processing'
  (not 404) so the frontend can retry — since the webhook can arrive slightly
  after Paystack redirects the customer.
- For org payments, success is determined by school record / webhook marker,
  not AccessCode lookup.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


class _FakePaystackResponse:
    def __init__(self, payload: dict):
        self._payload = payload

    def json(self):
        return self._payload


class _FakePaystackClient:
    """Stands in for httpx.AsyncClient() inside verify_payment."""

    def __init__(self, payload: dict):
        self._payload = payload

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return False

    async def get(self, *args, **kwargs):
        return _FakePaystackResponse(self._payload)


@pytest.mark.anyio
async def test_verify_payment_does_not_mutate_access_code_status():
    """The exact regression: a successful verify must leave status=pending."""
    fake_code = MagicMock()
    fake_code.status = "pending"
    fake_code.code = "IND-TEST-1234"

    paystack_payload = {
        "status": True,
        "data": {
            "status": "success",
            "customer": {"email": "payer@example.com"},
            "amount": 200_000,
            "metadata": {"payment_type": "individual"},
        },
    }

    with (
        patch(
            "app.api.v1.endpoints.payments.httpx.AsyncClient",
            return_value=_FakePaystackClient(paystack_payload),
        ),
        patch("app.api.v1.endpoints.payments.db_session") as mock_ctx,
        patch(
            "app.api.v1.endpoints.payments.is_webhook_processed",
            new=AsyncMock(return_value=False),
        ),
    ):
        mock_session = AsyncMock()
        mock_session.execute = AsyncMock(
            return_value=MagicMock(scalar_one_or_none=MagicMock(return_value=fake_code))
        )
        mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.get("/api/v1/payment/verify?reference=test-ref-123")

    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "payer@example.com"
    assert data["access_code"] == "IND-TEST-1234"
    assert data["payment_type"] == "individual"

    # Core regression guard: verify_payment must never flip the code's status.
    assert fake_code.status == "pending"
    mock_session.commit.assert_not_awaited()


@pytest.mark.anyio
async def test_verify_payment_returns_processing_when_no_pending_code_exists():
    """If the webhook hasn't created a pending code yet, verify should return
    'processing' so the frontend can retry — NOT a hard 404."""
    paystack_payload = {
        "status": True,
        "data": {
            "status": "success",
            "customer": {"email": "nocode@example.com"},
            "amount": 200_000,
            "metadata": {"payment_type": "individual"},
        },
    }

    with (
        patch(
            "app.api.v1.endpoints.payments.httpx.AsyncClient",
            return_value=_FakePaystackClient(paystack_payload),
        ),
        patch("app.api.v1.endpoints.payments.db_session") as mock_ctx,
        patch(
            "app.api.v1.endpoints.payments.is_webhook_processed",
            new=AsyncMock(return_value=False),
        ),
    ):
        mock_session = AsyncMock()
        mock_session.execute = AsyncMock(
            return_value=MagicMock(
                scalar_one_or_none=MagicMock(return_value=None),
                scalars=MagicMock(
                    return_value=MagicMock(first=MagicMock(return_value=None))
                ),
            )
        )
        mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.get("/api/v1/payment/verify?reference=test-ref-456")

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "processing"
    assert data["payment_type"] == "individual"
    assert data["email"] == "nocode@example.com"
