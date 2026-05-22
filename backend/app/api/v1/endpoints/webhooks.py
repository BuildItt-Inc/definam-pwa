from __future__ import annotations

from fastapi import APIRouter, Header, Request

from app.services import webhook_service

router = APIRouter()


@router.post("/paystack")
async def paystack_webhook(
    request: Request,
    x_paystack_signature: str = Header(...),
) -> dict:
    """
    Receives Paystack webhook events.
    Signature verification, idempotency, and all processing live in webhook_service.
    """
    raw_body = await request.body()
    return await webhook_service.handle_event(raw_body, x_paystack_signature)
