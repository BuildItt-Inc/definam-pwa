from __future__ import annotations

import asyncio

import httpx

from app.core.config import get_settings
from app.core.exceptions import PaymentGatewayError
from app.schemas.payments import (
    IndividualPaymentRequest,
    IndividualPaymentResponse,
    OrgPaymentRequest,
    OrgPaymentResponse,
)

PAYSTACK_BASE = "https://api.paystack.co"
SINGLE_TERM_PRICE_KOBO = 200_000  # ₦2,000
THREE_TERM_PRICE_KOBO = 510_000  # ₦5,100 (15% discount)


def _paystack_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {get_settings().paystack_secret_key}",
        "Content-Type": "application/json",
    }


_client: httpx.AsyncClient | None = None
_loop: asyncio.AbstractEventLoop | None = None


async def _get_client() -> httpx.AsyncClient:
    global _client, _loop
    try:
        current_loop = asyncio.get_running_loop()
    except RuntimeError:
        current_loop = None

    if _client is None or _client.is_closed or _loop is not current_loop:
        if _client is not None and not _client.is_closed:
            await _client.aclose()
        _client = httpx.AsyncClient()
        _loop = current_loop
    return _client


async def _initiate_transaction(
    email: str,
    amount_kobo: int,
    metadata: dict,
    callback_url: str,
) -> dict:
    payload = {
        "email": email,
        "amount": amount_kobo,
        "metadata": metadata,
        "callback_url": callback_url,
        "currency": "NGN",
    }
    client = await _get_client()
    resp = await client.post(
        f"{PAYSTACK_BASE}/transaction/initialize",
        json=payload,
        headers=_paystack_headers(),
        timeout=15,
    )

    if resp.status_code != 200:
        raise PaymentGatewayError(f"Paystack error: {resp.text}")

    data = resp.json()
    if not data.get("status"):
        raise PaymentGatewayError(data.get("message", "Paystack error"))

    return data["data"]


async def initiate_individual(
    body: IndividualPaymentRequest,
) -> IndividualPaymentResponse:
    """
    Create a Paystack transaction for an individual student (1 term = ₦2,000, 3 terms = ₦5,100).
    Embeds payment_type and terms metadata so the webhook can route correctly.
    """
    settings = get_settings()
    terms = 3 if body.terms == 3 else 1
    amount_kobo = THREE_TERM_PRICE_KOBO if terms == 3 else SINGLE_TERM_PRICE_KOBO
    callback_url = f"{settings.frontend_url.rstrip('/')}/pay/callback?type=individual&terms={terms}"

    data = await _initiate_transaction(
        email=str(body.email),
        amount_kobo=amount_kobo,
        metadata={
            "payment_type": "individual",
            "email": str(body.email),
            "terms": terms,
        },
        callback_url=callback_url,
    )
    return IndividualPaymentResponse(
        authorization_url=data["authorization_url"],
        reference=data["reference"],
    )


async def initiate_org(body: OrgPaymentRequest) -> OrgPaymentResponse:
    """
    Create a Paystack transaction for a school (N × ₦2,000 per seat per term).
    Embeds payment_type metadata so the webhook can route correctly.
    """
    settings = get_settings()
    total_kobo = body.student_count * SINGLE_TERM_PRICE_KOBO
    callback_url = f"{settings.frontend_url.rstrip('/')}/pay/callback?type=organisation"

    data = await _initiate_transaction(
        email=str(body.school_email),
        amount_kobo=total_kobo,
        metadata={
            "payment_type": "org",
            "school_email": str(body.school_email),
            "school_name": body.school_name,
            "student_count": body.student_count,
        },
        callback_url=callback_url,
    )
    return OrgPaymentResponse(
        authorization_url=data["authorization_url"],
        reference=data["reference"],
        total_amount_naira=total_kobo // 100,
    )
