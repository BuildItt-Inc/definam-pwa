"""Regression test for the individual payment -> registration flow.

Guards against re-introducing the bug where verify_payment() prematurely
marked an access code "active" before the customer ever registered with
it, causing register() to reject it as already-used. verify_payment()
must confirm the transaction and confirm a pending code exists, but must
NOT mutate the code's status -- only register()'s activate_code() may do
that, tied to the real user_id that redeemed it.
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
            "customer": {"email": "payer@example.com"},
            "amount": 200_000,
        },
    }

    with (
        patch(
            "app.api.v1.endpoints.payments.httpx.AsyncClient",
            return_value=_FakePaystackClient(paystack_payload),
        ),
        patch("app.api.v1.endpoints.payments.db_session") as mock_ctx,
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
    assert resp.json()["email"] == "payer@example.com"
    assert resp.json()["access_code"] == "IND-TEST-1234"

    # The core regression guard: verify_payment must never flip the code's
    # status. If this fails, register() will reject the code as already
    # used the moment the customer tries to redeem it.
    assert fake_code.status == "pending"
    mock_session.commit.assert_not_awaited()


@pytest.mark.anyio
async def test_verify_payment_404s_when_no_pending_code_exists():
    """If the webhook hasn't created a pending code yet, verify should 404,
    not silently succeed."""
    paystack_payload = {
        "status": True,
        "data": {
            "customer": {"email": "nocode@example.com"},
            "amount": 200_000,
        },
    }

    with (
        patch(
            "app.api.v1.endpoints.payments.httpx.AsyncClient",
            return_value=_FakePaystackClient(paystack_payload),
        ),
        patch("app.api.v1.endpoints.payments.db_session") as mock_ctx,
    ):
        mock_session = AsyncMock()
        mock_session.execute = AsyncMock(
            return_value=MagicMock(scalar_one_or_none=MagicMock(return_value=None))
        )
        mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.get("/api/v1/payment/verify?reference=test-ref-456")

    assert resp.status_code == 404
