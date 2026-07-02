from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.db.database import db_session
from app.db.models import ChatDailyUsage


async def increment_daily_usage(user_id: str) -> int:
    today = datetime.now(UTC).date()
    async with db_session() as session:
        try:
            # Lock row to prevent race conditions
            result = await session.execute(
                select(ChatDailyUsage)
                .where(
                    ChatDailyUsage.user_id == user_id,
                    ChatDailyUsage.date == today
                )
                .with_for_update()
            )
            usage = result.scalar_one_or_none()
            if usage:
                usage.count += 1
                await session.commit()
                return usage.count

            # Insert new record
            usage = ChatDailyUsage(
                user_id=user_id,
                date=today,
                count=1
            )
            session.add(usage)
            await session.commit()
            return usage.count

        except IntegrityError:
            # Concurrent insert – retry
            await session.rollback()
            result = await session.execute(
                select(ChatDailyUsage)
                .where(
                    ChatDailyUsage.user_id == user_id,
                    ChatDailyUsage.date == today
                )
                .with_for_update()
            )
            usage = result.scalar_one_or_none()
            if usage:
                usage.count += 1
                await session.commit()
                return usage.count
            raise

async def get_daily_usage(user_id: str) -> int:
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