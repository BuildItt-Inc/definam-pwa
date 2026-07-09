from __future__ import annotations

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import CurrentUserDep
from app.db.database import db_session
from app.db.models import DailyRecallQueue, TopicReview

router = APIRouter(prefix="/students", tags=["students"])


@router.get("/me/heatmap")
async def get_student_heatmap(claims: CurrentUserDep) -> list[dict]:
    """
    Return a 90-day study activity heatmap for the authenticated student.
    Includes days with 0 activity.
    """
    user_id = claims["sub"]
    today = datetime.now(UTC).date()
    start_date = today - timedelta(days=89)
    start_datetime = datetime.combine(start_date, datetime.min.time(), tzinfo=UTC)

    async with db_session() as session:
        # Fetch topic reviews created in the last 90 days
        reviews_stmt = (
            select(TopicReview.created_at, TopicReview.topic_id)
            .where(
                TopicReview.user_id == user_id,
                TopicReview.created_at >= start_datetime,
            )
        )
        reviews_result = await session.execute(reviews_stmt)
        reviews = reviews_result.all()

        # Fetch completed daily recall queue items rated in the last 90 days
        queue_stmt = (
            select(DailyRecallQueue.rated_at, DailyRecallQueue.topic_id)
            .where(
                DailyRecallQueue.user_id == user_id,
                DailyRecallQueue.completed == 1,
                DailyRecallQueue.rated_at >= start_datetime,
            )
        )
        queue_result = await session.execute(queue_stmt)
        queue_items = queue_result.all()

    # Group by date and count distinct topic_ids per day
    activity_by_date: dict[str, set[str]] = {}

    for dt, topic_id in reviews:
        if dt:
            date_str = dt.date().isoformat()
            activity_by_date.setdefault(date_str, set()).add(topic_id)

    for dt, topic_id in queue_items:
        if dt:
            date_str = dt.date().isoformat()
            activity_by_date.setdefault(date_str, set()).add(topic_id)

    # Build the 90-day heatmap response
    heatmap = []
    for i in range(90):
        current_date = (start_date + timedelta(days=i)).isoformat()
        distinct_topics = activity_by_date.get(current_date, set())
        heatmap.append({
            "date": current_date,
            "count": len(distinct_topics),
        })

    return heatmap
