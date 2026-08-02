from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta

from sqlalchemy import select, update

from app.core.config import get_settings
from app.core.email import send_expiration_reminder
from app.db.database import db_session
from app.db.models import AccessCode, School, User

logger = logging.getLogger(__name__)


async def check_and_send_expiration_reminders() -> int:
    """
    Check for active or pending access codes expiring within 7 days
    that haven't had a reminder sent yet. Sends email reminders and
    updates reminder_sent = True.
    """
    settings = get_settings()
    now = datetime.now(UTC)
    seven_days = now + timedelta(days=7)
    renew_url = f"{settings.app_url.rstrip('/')}/pay/individual"

    sent_count = 0

    async with db_session() as session:
        stmt = (
            select(
                AccessCode,
                User.email.label("user_email"),
                School.email.label("school_email"),
            )
            .outerjoin(User, AccessCode.activated_by == User.id)
            .outerjoin(School, AccessCode.school_id == School.id)
            .where(
                AccessCode.expires_at.is_not(None),
                AccessCode.expires_at <= seven_days,
                AccessCode.expires_at > now,
                AccessCode.reminder_sent.is_(False),
                AccessCode.status.in_(["active", "pending"]),
            )
        )
        results = (await session.execute(stmt)).all()

        for code_obj, user_email, school_email in results:
            target_email = code_obj.email or user_email or school_email
            if not target_email:
                continue

            expires_str = (
                code_obj.expires_at.strftime("%B %d, %Y")
                if code_obj.expires_at
                else "in 7 days"
            )

            try:
                await send_expiration_reminder(
                    to=target_email,
                    code=code_obj.code,
                    expires_at_str=expires_str,
                    renew_url=renew_url,
                )
                sent_count += 1
                await session.execute(
                    update(AccessCode)
                    .where(AccessCode.id == code_obj.id)
                    .values(reminder_sent=True)
                )
                logger.info(
                    "Sent expiration reminder email to %s for code %s",
                    target_email,
                    code_obj.code,
                )
            except Exception as exc:
                logger.error(
                    "Failed sending expiration reminder email to %s: %s",
                    target_email,
                    exc,
                )

    return sent_count
