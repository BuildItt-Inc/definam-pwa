"""Student-facing endpoints: dashboard summary."""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter
from sqlalchemy import and_, func, select, text
from sqlalchemy.types import Date

from app.api.deps import CurrentUserDep
from app.core.exceptions import NotFoundError
from app.db.database import db_session
from app.db.models import DailyRecallQueue, School, User

router = APIRouter(tags=["students"])


@router.get("/dashboard")
async def get_dashboard(claims: CurrentUserDep) -> dict:
    """
    Return a single-shot dashboard payload for the home screen.

    Includes: student name, school name, streak (days), and recall summary.
    Individual students will have school_name = null.
    """
    user_id: str = claims["sub"]
    now = datetime.now(UTC)
    today = now.date()

    async with db_session() as session:
        # Fetch user + school in one join
        result = await session.execute(
            select(User, School.name.label("school_name"))
            .outerjoin(School, User.org_id == School.id)
            .where(User.id == user_id)
        )
        row = result.one_or_none()
        if not row:
            raise NotFoundError("User not found.")
        user, school_name = row

        # Streak: consecutive calendar days (desc) with at least one
        # completed recall session, counting from today or yesterday
        completed_days_result = await session.execute(
            select(
                func.date_trunc("day", DailyRecallQueue.due_date)
                .cast(Date)
                .label("day")
            )
            .where(
                and_(
                    DailyRecallQueue.user_id == user_id,
                    DailyRecallQueue.completed == 1,
                )
            )
            .group_by(text("day"))
            .order_by(text("day desc"))
        )
        completed_days = [r.day for r in completed_days_result]
        streak = _compute_streak(completed_days)

        # Recall summary
        recall_result = await session.execute(
            select(
                func.count().label("total_pending"),
                func.sum(
                    func.cast(
                        and_(
                            DailyRecallQueue.due_date < func.now(),
                            DailyRecallQueue.completed == 0,
                        ),
                        type_=func.count().type,
                    )
                ).label("overdue"),
            ).where(
                and_(
                    DailyRecallQueue.user_id == user_id,
                    DailyRecallQueue.completed == 0,
                )
            )
        )
        # Simpler — run two targeted queries for clarity
        due_today_count = (
            await session.execute(
                select(func.count()).where(
                    and_(
                        DailyRecallQueue.user_id == user_id,
                        DailyRecallQueue.completed == 0,
                        func.date_trunc("day", DailyRecallQueue.due_date).cast(Date)
                        == today,
                    )
                )
            )
        ).scalar() or 0

        completed_today_count = (
            await session.execute(
                select(func.count()).where(
                    and_(
                        DailyRecallQueue.user_id == user_id,
                        DailyRecallQueue.completed == 1,
                        func.date_trunc("day", DailyRecallQueue.due_date).cast(Date)
                        == today,
                    )
                )
            )
        ).scalar() or 0

        total_pending_count = (
            await session.execute(
                select(func.count()).where(
                    and_(
                        DailyRecallQueue.user_id == user_id,
                        DailyRecallQueue.completed == 0,
                    )
                )
            )
        ).scalar() or 0

    return {
        "id": user.id,
        "username": user.username,
        "school_name": school_name,
        "streak_days": streak,
        "recall_summary": {
            "due_today": int(due_today_count),
            "completed_today": int(completed_today_count),
            "total_pending": int(total_pending_count),
        },
    }


def _compute_streak(days_desc: list) -> int:
    """Count consecutive calendar days (desc-ordered) ending today or yesterday."""
    from datetime import date, timedelta

    if not days_desc:
        return 0

    today = date.today()
    streak = 0
    expected = today

    for d in days_desc:
        if d == expected:
            streak += 1
            expected = d - timedelta(days=1)
        elif streak == 0 and d == today - timedelta(days=1):
            # Allow streak starting from yesterday if no session yet today
            streak += 1
            expected = d - timedelta(days=1)
        else:
            break

    return streak
