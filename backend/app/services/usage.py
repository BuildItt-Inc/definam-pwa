# app/services/usage.py
from datetime import datetime, UTC
from sqlalchemy import select
from app.db.database import db_session
from app.db.models import ChatDailyUsage

async def increment_daily_usage(user_id: str) -> int:
    """
    Increment the daily message count for a user.
    Returns the new count (after increment).
    """
    today = datetime.now(UTC).date()
    async with db_session() as session:
        # Try to get existing record
        result = await session.execute(
            select(ChatDailyUsage).where(
                ChatDailyUsage.user_id == user_id,
                ChatDailyUsage.date == today
            )
        )
        usage = result.scalar_one_or_none()
        if usage:
            usage.count += 1
        else:
            usage = ChatDailyUsage(
                user_id=user_id,
                date=today,
                count=1
            )
            session.add(usage)
        await session.commit()
        return usage.count

async def get_daily_usage(user_id: str) -> int:
    """
    Get the current daily usage count from the database.
    """
    today = datetime.now(UTC).date()
    async with db_session() as session:
        result = await session.execute(
            select(ChatDailyUsage).where(
                ChatDailyUsage.user_id == user_id,
                ChatDailyUsage.date == today
            )
        )
        usage = result.scalar_one_or_none()
        return usage.count if usage else 0