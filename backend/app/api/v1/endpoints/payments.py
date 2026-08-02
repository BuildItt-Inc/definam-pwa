from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select

from app.core.config import get_settings
from app.db.database import db_session
from app.db.models import AccessCode
from app.schemas.payments import (
    IndividualPaymentRequest,
    IndividualPaymentResponse,
    OrgPaymentRequest,
    OrgPaymentResponse,
)
from app.services import payment_service

router = APIRouter()


@router.post("/individual", response_model=IndividualPaymentResponse)
async def initiate_individual_payment(
    body: IndividualPaymentRequest,
) -> IndividualPaymentResponse:
    """Start a Paystack transaction for an individual student (₦1,700)."""
    return await payment_service.initiate_individual(body)


@router.post("/org", response_model=OrgPaymentResponse)
async def initiate_org_payment(body: OrgPaymentRequest) -> OrgPaymentResponse:
    """Start a Paystack transaction for a school (N students × ₦1,700)."""
    return await payment_service.initiate_org(body)


@router.get("/verify")
async def verify_payment(
    reference: str = Query(..., description="Paystack transaction reference")
):
    """Verify a Paystack transaction confirmed and a pending access code exists.

    Does not mutate the access code's status — it stays "pending" until the
    customer registers with it (see auth_service.register/activate_code).
    """
    settings = get_settings()
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://api.paystack.co/transaction/verify/{reference}",
            headers={"Authorization": f"Bearer {settings.paystack_secret_key}"}
        )
        data = resp.json()

    if not data.get("status"):
        raise HTTPException(400, detail=data.get("message", "Verification failed"))

    transaction = data["data"]
    email = transaction["customer"]["email"]
    amount = transaction["amount"] / 100  # kobo to naira

    # Confirm the webhook has created a pending access code for this email.
    # Do NOT change its status here — the code must stay "pending" until the
    # customer actually registers with it. register()'s activate_code() is
    # the only place a code is meant to transition out of "pending", tied
    # to the real user_id that redeemed it.
    async with db_session() as session:
        result = await session.execute(
            select(AccessCode).where(
                AccessCode.email == email,
                AccessCode.status == "pending"
            )
        )
        code = result.scalar_one_or_none()
        if not code:
            raise HTTPException(404, detail="No pending access code found for this email")
        access_code = code.code

    return {
        "status": "success",
        "reference": reference,
        "email": email,
        "amount": amount,
        "access_code": access_code,
    }


@router.post("/check-expirations")
async def trigger_check_expirations() -> dict:
    """Check for access codes expiring in <= 7 days and dispatch renewal reminder emails."""
    from app.services.expiration_service import check_and_send_expiration_reminders
    reminders_sent = await check_and_send_expiration_reminders()
    return {"status": "success", "reminders_sent": reminders_sent}