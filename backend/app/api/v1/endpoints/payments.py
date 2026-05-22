from __future__ import annotations

from fastapi import APIRouter

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
