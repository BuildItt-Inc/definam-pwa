"""Daily-activity tracking — the streak signal.

Any meaningful student action (opening/progressing a topic, completing
practice, submitting a recall rating) should call `touch_daily_activity`
so the streak reflects "showed up today", not just "finished something
today". Idempotent per (user, day) via ON CONFLICT DO NOTHING, so it's
safe to call multiple times in the same session.
"""
from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import DailyActivity


async def touch_daily_activity(session: AsyncSession, user_id: str) -> bool:
    """Returns True if this call recorded the first activity of the day for
    this user (i.e. today wasn't already counted), False if it was already
    recorded — the signal callers use to decide whether to celebrate.
    """
    today = datetime.now(UTC).date()
    stmt = (
        pg_insert(DailyActivity)
        .values(user_id=user_id, activity_date=today)
        .on_conflict_do_nothing(constraint="uq_daily_activity_user_date")
        .returning(DailyActivity.id)
    )
    result = await session.execute(stmt)
    return result.first() is not None
