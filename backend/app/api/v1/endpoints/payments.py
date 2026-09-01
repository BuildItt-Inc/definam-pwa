from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select

from app.core.config import get_settings
from app.db.database import db_session, get_school_by_email, is_webhook_processed
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
    reference: str = Query(..., description="Paystack transaction reference"),
):
    """Verify a Paystack transaction confirmed and that access setup has occurred.

    Does not mutate the access code's status — it stays "pending" until the
    customer registers with it (see auth_service.register/activate_code).
    """
    settings = get_settings()
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://api.paystack.co/transaction/verify/{reference}",
            headers={"Authorization": f"Bearer {settings.paystack_secret_key}"},
        )
        data = resp.json()

    if not data.get("status"):
        raise HTTPException(400, detail=data.get("message", "Verification failed"))

    transaction = data["data"]
    if transaction.get("status") != "success":
        raise HTTPException(
            400, detail=f"Transaction status is {transaction.get('status', 'failed')}"
        )

    email = transaction["customer"]["email"]
    amount = transaction["amount"] / 100  # kobo to naira
    metadata = transaction.get("metadata") or {}
    payment_type = metadata.get("payment_type", "individual")

    if payment_type == "org":
        school_email = metadata.get("school_email", email)
        school_name = metadata.get("school_name", "")
        student_count = int(metadata.get("student_count", 0))

        school = await get_school_by_email(school_email)
        webhook_done = await is_webhook_processed(reference)

        if school or webhook_done:
            return {
                "status": "success",
                "payment_type": "organisation",
                "reference": reference,
                "admin_email": school_email,
                "org_name": school_name or (school["name"] if school else ""),
                "student_count": student_count
                or (school["active_seats"] if school else 0),
                "amount": amount,
            }

        return {
            "status": "processing",
            "payment_type": "organisation",
            "reference": reference,
            "admin_email": school_email,
            "org_name": school_name,
            "student_count": student_count,
            "amount": amount,
            "message": "Payment confirmed. School account creation is in progress...",
        }

    # Individual payment path
    async with db_session() as session:
        result = await session.execute(
            select(AccessCode).where(
                AccessCode.email == email, AccessCode.status == "pending"
            )
        )
        code = result.scalar_one_or_none()

    if code:
        return {
            "status": "success",
            "payment_type": "individual",
            "reference": reference,
            "email": email,
            "amount": amount,
            "access_code": code.code,
        }

    webhook_done = await is_webhook_processed(reference)
    if webhook_done:
        async with db_session() as session:
            result = await session.execute(
                select(AccessCode).where(AccessCode.email == email)
            )
            any_code = result.scalars().first()
            if any_code:
                return {
                    "status": "success",
                    "payment_type": "individual",
                    "reference": reference,
                    "email": email,
                    "amount": amount,
                    "access_code": any_code.code,
                }

    return {
        "status": "processing",
        "payment_type": "individual",
        "reference": reference,
        "email": email,
        "amount": amount,
        "message": "Payment confirmed. Access code generation is in progress...",
    }


@router.post("/check-expirations")
async def trigger_check_expirations() -> dict:
    """Check for access codes expiring in <= 7 days and dispatch renewal reminder emails."""
    from app.services.expiration_service import check_and_send_expiration_reminders

    reminders_sent = await check_and_send_expiration_reminders()
    return {"status": "success", "reminders_sent": reminders_sent}
