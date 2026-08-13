from __future__ import annotations

import hashlib
import hmac
import io
import json
import logging
import uuid

from app.core.config import get_settings
from app.core.email import (
    send_individual_code,
    send_org_admin_credentials,
    send_payment_receipt,
)
from app.core.exceptions import InvalidWebhookSignatureError
from app.core.security import (
    generate_access_code,
    generate_temp_password,
    hash_password,
)
from app.db.database import (
    bulk_insert_codes,
    create_org,
    create_student_user,
    get_school_by_email,
    get_user_by_username,
    insert_individual_code,
    is_webhook_processed,
    mark_webhook_processed,
    update_school_seats,
    update_user_org_and_role,
)

logger = logging.getLogger(__name__)


def verify_signature(raw_body: bytes, signature: str) -> None:
    """Verify Paystack HMAC-SHA512 signature. Raises on mismatch."""
    settings = get_settings()

    secret_keys = [
        getattr(settings, "paystack_secret_key", None),
        getattr(settings, "paystack_webhook_secret", None),
    ]
    for secret_val in secret_keys:
        if not secret_val:
            continue
        secret = secret_val.encode()
        expected = hmac.new(secret, raw_body, hashlib.sha512).hexdigest()
        if hmac.compare_digest(expected, signature):
            return

    raise InvalidWebhookSignatureError()


async def handle_event(raw_body: bytes, signature: str) -> dict:
    """
    Entry point for all Paystack webhook events.
    Verifies signature, deduplicates, and routes to the correct handler.
    Always returns {\"received\": True} so Paystack gets a 200.
    """
    verify_signature(raw_body, signature)

    event = json.loads(raw_body)

    if event.get("event") != "charge.success":
        return {"received": True}

    data = event.get("data", {})
    reference: str = data.get("reference", "")
    metadata: dict = data.get("metadata", {})
    payment_type: str = metadata.get("payment_type", "")

    if await is_webhook_processed(reference):
        logger.info("Duplicate webhook reference=%s — skipping.", reference)
        return {"received": True}

    try:
        if payment_type == "individual":
            await _handle_individual(data, metadata)
        elif payment_type == "org":
            await _handle_org(data, metadata)
        else:
            logger.warning(
                "Unknown payment_type=%s for reference=%s", payment_type, reference
            )

        await mark_webhook_processed(reference)
    except Exception as exc:
        logger.exception("Webhook handler error for reference=%s", reference)
        raise exc

    return {"received": True}


async def _handle_individual(data: dict, metadata: dict) -> None:
    """Generate and email an individual access code after payment."""
    email: str = metadata["email"]
    terms: int = int(metadata.get("terms", 1))
    default_amount = 510_000 if terms == 3 else 200_000
    amount_kobo: int = data.get("amount", default_amount)

    code = generate_access_code("individual")
    await insert_individual_code(code, email, terms=terms)

    term_text = f"{terms} Terms Access" if terms > 1 else "1 Term Access"
    await send_individual_code(email, code)
    await send_payment_receipt(
        email, amount_kobo // 100, f"Recall Individual ({term_text})"
    )
    logger.info("Individual code %s (%d terms) issued to %s", code, terms, email)


async def _handle_org(data: dict, metadata: dict) -> None:
    """
    After org payment:
    1. Create school record
    2. Bulk-generate access codes
    3. Create admin user with bcrypt-hashed temp password
    4. Email admin with credentials + CSV
    """
    school_email: str = metadata["school_email"]
    school_name: str = metadata["school_name"]
    student_count: int = int(metadata["student_count"])
    amount_kobo: int = data.get("amount", student_count * 170_000)

    settings = get_settings()

    # Check if school already exists
    existing_school = await get_school_by_email(school_email)
    if existing_school:
        org_id = existing_school["id"]
        # Increment the school's active seats
        new_seat_count = existing_school["active_seats"] + student_count
        await update_school_seats(org_id, new_seat_count)
        logger.info(
            "School %s already exists. Updated seats to %d",
            school_email,
            new_seat_count,
        )
    else:
        org_id = await create_org(
            email=school_email, name=school_name, seat_count=student_count
        )

    codes = [generate_access_code("org") for _ in range(student_count)]
    await bulk_insert_codes(org_id, codes)

    temp_password = generate_temp_password()

    # Check if admin user already exists
    existing_admin = await get_user_by_username(school_email)
    if existing_admin:
        logger.info(
            "Admin user %s already exists. Re-using existing account and updating org/role.",
            school_email,
        )
        await update_user_org_and_role(
            user_id=existing_admin["id"],
            org_id=org_id,
            role="admin",
        )
        # Use a placeholder message in the email indicating password remains unchanged
        temp_password = "[Your existing password]"
    else:
        admin_user_id = str(uuid.uuid4())
        await create_student_user(
            user_id=admin_user_id,
            org_id=org_id,
            role="admin",
            username=school_email,  # admins log in with their school email
            password_hash=await hash_password(temp_password),
            force_password_change=True,
        )

    csv_bytes = _build_csv(codes)
    login_url = f"{settings.frontend_url}/login"

    await send_org_admin_credentials(
        school_email, school_name, temp_password, login_url, csv_bytes, student_count
    )
    await send_payment_receipt(
        school_email,
        amount_kobo // 100,
        f"Recall Organisation — {student_count} seats for {school_name}",
    )
    logger.info(
        "Org %s created with %d codes, admin=%s",
        school_name,
        student_count,
        school_email,
    )


def _build_csv(codes: list[str]) -> bytes:
    buf = io.StringIO()
    buf.write("access_code\n")
    for code in codes:
        buf.write(f"{code}\n")
    return buf.getvalue().encode()
