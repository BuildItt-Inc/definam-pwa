"""Student-facing endpoints: dashboard summary."""

from __future__ import annotations

from datetime import UTC, date, datetime

from fastapi import APIRouter
from sqlalchemy import and_, case, func, select, text
from sqlalchemy.types import Date

from app.api.deps import CurrentUserDep
from app.core.exceptions import NotFoundError
from app.db.database import db_session
from app.db.models import (
    Chapter,
    DailyRecallQueue,
    School,
    Subject,
    Topic,
    TopicReview,
    User,
)

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
        streak = _compute_streak(completed_days, today)

        # Recall summary: run a single query to get all counts
        recall_summary_query = select(
            func.sum(
                case(
                    (
                        and_(
                            DailyRecallQueue.completed == 0,
                            func.date_trunc("day", DailyRecallQueue.due_date).cast(Date) == today,
                        ),
                        1,
                    ),
                    else_=0,
                )
            ).label("due_today"),
            func.sum(
                case(
                    (
                        and_(
                            DailyRecallQueue.completed == 1,
                            func.date_trunc("day", DailyRecallQueue.due_date).cast(Date) == today,
                        ),
                        1,
                    ),
                    else_=0,
                )
            ).label("completed_today"),
            func.sum(
                case(
                    (DailyRecallQueue.completed == 0, 1),
                    else_=0,
                )
            ).label("total_pending"),
        ).where(DailyRecallQueue.user_id == user_id)

        summary_row = (await session.execute(recall_summary_query)).one()
        due_today_count = summary_row.due_today or 0
        completed_today_count = summary_row.completed_today or 0
        total_pending_count = summary_row.total_pending or 0

        # Recall queue: topics due today or overdue
        queue_q = (
            select(
                DailyRecallQueue.topic_id,
                Topic.title.label("topic_title"),
                Subject.name.label("subject"),
            )
            .join(Topic, DailyRecallQueue.topic_id == Topic.id)
            .join(Chapter, Topic.chapter_id == Chapter.id)
            .join(Subject, Chapter.subject_id == Subject.id)
            .where(
                and_(
                    DailyRecallQueue.user_id == user_id,
                    DailyRecallQueue.completed == 0,
                    func.date_trunc("day", DailyRecallQueue.due_date).cast(Date) <= today,
                )
            )
            .limit(10)
        )
        queue_rows = await session.execute(queue_q)
        recall_queue = [
            {
                "topic_id": r.topic_id,
                "topic_title": r.topic_title,
                "subject": r.subject,
            }
            for r in queue_rows
        ]

        # Recent topics: topics recently reviewed by this student
        recent_q = (
            select(
                TopicReview.topic_id,
                Topic.title.label("topic_title"),
                Subject.name.label("subject"),
                TopicReview.accuracy_score.label("mastery_percent"),
            )
            .join(Topic, TopicReview.topic_id == Topic.id)
            .join(Chapter, Topic.chapter_id == Chapter.id)
            .join(Subject, Chapter.subject_id == Subject.id)
            .where(TopicReview.user_id == user_id)
            .order_by(TopicReview.last_reviewed_at.desc())
            .limit(5)
        )
        recent_rows = await session.execute(recent_q)
        recent_topics = [
            {
                "topic_id": r.topic_id,
                "topic_title": r.topic_title,
                "subject": r.subject,
                "mastery_percent": int(r.mastery_percent or 0),
            }
            for r in recent_rows
        ]

        # Fallback for brand new users: suggest the first 3 topics in the DB
        if not recent_topics:
            fallback_q = (
                select(
                    Topic.id.label("topic_id"),
                    Topic.title.label("topic_title"),
                    Subject.name.label("subject"),
                )
                .join(Chapter, Topic.chapter_id == Chapter.id)
                .join(Subject, Chapter.subject_id == Subject.id)
                .limit(3)
            )
            fallback_rows = await session.execute(fallback_q)
            recent_topics = [
                {
                    "topic_id": r.topic_id,
                    "topic_title": r.topic_title,
                    "subject": r.subject,
                    "mastery_percent": 0,
                }
                for r in fallback_rows
            ]

    return {
        "id": user.id,
        "username": user.username,
        "student_name": user.username,  # Frontend expects student_name
        "school_name": school_name or "Independent Learner",
        "streak_days": streak,
        "recall_summary": {
            "due_today": int(due_today_count),
            "completed_today": int(completed_today_count),
            "total_pending": int(total_pending_count),
        },
        "recall_queue": recall_queue,
        "recent_topics": recent_topics,
    }


def _compute_streak(days_desc: list, today: date) -> int:
    """Count consecutive calendar days (desc-ordered) ending today or yesterday."""
    from datetime import timedelta

    if not days_desc:
        return 0

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


# ── GET /students/me/heatmap ─────────────────────────────────────────────────


@router.get("/me/heatmap")
async def get_heatmap(claims: CurrentUserDep) -> list[dict]:
    """
    Return a 90-day study activity heatmap for the student.

    Always returns exactly 90 entries (one per calendar day, newest last).
    Each entry has ``date`` (ISO-8601) and ``count`` (activities that day).
    """
    from datetime import timedelta

    user_id: str = claims["sub"]
    now = datetime.now(UTC)
    today = now.date()
    start = today - timedelta(days=89)  # inclusive, giving 90 days total

    async with db_session() as session:
        # TopicReview activity: days the student reviewed a topic
        reviews_result = await session.execute(
            select(
                func.date_trunc("day", TopicReview.last_reviewed_at)
                .cast(Date)
                .label("day"),
                func.count().label("cnt"),
            )
            .where(
                and_(
                    TopicReview.user_id == user_id,
                    TopicReview.last_reviewed_at >= func.cast(start, type_=Date),
                )
            )
            .group_by(text("day"))
        )
        counts: dict[date, int] = {row.day: row.cnt for row in reviews_result}

        # DailyRecallQueue completions: add to counts
        queue_result = await session.execute(
            select(
                func.date_trunc("day", DailyRecallQueue.due_date)
                .cast(Date)
                .label("day"),
                func.count().label("cnt"),
            )
            .where(
                and_(
                    DailyRecallQueue.user_id == user_id,
                    DailyRecallQueue.completed == 1,
                    DailyRecallQueue.due_date >= func.cast(start, type_=Date),
                )
            )
            .group_by(text("day"))
        )
        for row in queue_result:
            counts[row.day] = counts.get(row.day, 0) + row.cnt

    # Build the full 90-day spine, filling zeros where there was no activity
    return [
        {
            "date": (start + timedelta(days=i)).isoformat(),
            "count": counts.get(start + timedelta(days=i), 0),
        }
        for i in range(90)
    ]
