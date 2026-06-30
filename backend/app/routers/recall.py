import json
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select

from app.core.auth import get_current_user
from app.db.database import db_session
from app.db.models import Topic, TopicReview
from app.services.redis_client import get_redis
from app.services.sm2 import sm2_calculate

router = APIRouter(prefix="/api/v1", tags=["recall"])

class RecallRating(BaseModel):
    rating: int


# ──────────────────────────────────────────────
#  Step 4 write endpoint (Naga’s ticket)
# ──────────────────────────────────────────────
@router.post("/topics/{topic_id}/review")
async def record_step4_attempt(
    topic_id: str,
    user=Depends(get_current_user)
):
    """
    Record that the student completed Step 4 (before rating).
    This increments repetitions and updates last_reviewed_at.
    """
    async with db_session() as session:
        # Verify topic exists
        topic_exists = await session.execute(
            select(Topic.id).where(Topic.id == topic_id)
        )
        if not topic_exists.scalar_one_or_none():
            raise HTTPException(404, "Topic not found")

        # Get existing review
        result = await session.execute(
            select(TopicReview).where(
                TopicReview.topic_id == topic_id,
                TopicReview.user_id == user.id
            )
        )
        review = result.scalar_one_or_none()

        now = datetime.now(UTC)

        if not review:
            # First attempt: create row with repetitions = 1
            review = TopicReview(
                topic_id=topic_id,
                user_id=user.id,
                ease_factor=2.5,
                interval_days=1,
                repetitions=1,          # first attempt counts as 1
                last_reviewed_at=now,
                # next_review_at remains NULL until recall is submitted
            )
            session.add(review)
        else:
            # Subsequent attempts: increment repetitions
            review.repetitions += 1
            review.last_reviewed_at = now

        await session.commit()

        return {
            "topic_id": topic_id,
            "repetitions": review.repetitions,
            "last_reviewed_at": review.last_reviewed_at.isoformat(),
            "ease_factor": review.ease_factor,
            "interval_days": review.interval_days,
        }


# ──────────────────────────────────────────────
#  SM‑2 recall endpoint (your original ticket)
# ──────────────────────────────────────────────
@router.post("/topics/{topic_id}/recall")
async def submit_recall(
    topic_id: str,
    payload: RecallRating,
    user=Depends(get_current_user)
):
    rating = payload.rating

    if not 0 <= rating <= 5:
        raise HTTPException(400, "Rating must be between 0 and 5")

    async with db_session() as session:
        # Check if topic exists
        topic_exists = await session.execute(
            select(Topic.id).where(Topic.id == topic_id)
        )
        if not topic_exists.scalar_one_or_none():
            raise HTTPException(404, "Topic not found")

        # Get existing review
        result = await session.execute(
            select(TopicReview).where(
                TopicReview.topic_id == topic_id,
                TopicReview.user_id == user.id
            )
        )
        review = result.scalar_one_or_none()

        now = datetime.now(UTC)

        if not review:
            review = TopicReview(
                topic_id=topic_id,
                user_id=user.id,
                ease_factor=2.5,
                interval_days=1,
                repetitions=0,
                last_reviewed_at=now
            )
            session.add(review)
            await session.flush()

        # Run SM-2
        new_ef, new_interval, new_reps = sm2_calculate(
            rating=rating,
            ease_factor=review.ease_factor,
            interval=review.interval_days,
            repetitions=review.repetitions
        )

        # Update
        review.ease_factor = new_ef
        review.interval_days = new_interval
        review.repetitions = new_reps
        review.next_review_at = now + timedelta(days=new_interval)
        review.last_reviewed_at = now

        await session.commit()

        # Refresh Redis cache
        await refresh_recall_queue(user.id)

        return {
            "topic_id": topic_id,
            "rating": rating,
            "ease_factor": new_ef,
            "interval_days": new_interval,
            "repetitions": new_reps,
            "next_review_at": review.next_review_at.isoformat() if review.next_review_at else now.isoformat()  # type: ignore
        }


# ──────────────────────────────────────────────
#  Recall queue helpers (Redis caching)
# ──────────────────────────────────────────────
async def refresh_recall_queue(user_id: str):
    async with db_session() as session:
        now = datetime.now(UTC)
        result = await session.execute(
            select(TopicReview, Topic.title)
            .join(Topic, TopicReview.topic_id == Topic.id)
            .where(
                TopicReview.user_id == user_id,
                TopicReview.next_review_at <= now
            )
            .order_by(TopicReview.next_review_at.asc())
        )
        due_topics = []
        for review, title in result:
            due_topics.append({
                "topic_id": review.topic_id,
                "title": title,
                "next_review_at": review.next_review_at.isoformat() if review.next_review_at else None
            })

    r = get_redis()
    r.setex(f"recall_queue:{user_id}", 86400, json.dumps(due_topics))
    return due_topics


@router.get("/recall/queue")
async def get_recall_queue(user=Depends(get_current_user)):
    r = get_redis()
    key = f"recall_queue:{user.id}"
    cached = r.get(key)
    if cached:
        return json.loads(cached)
    return await refresh_recall_queue(user.id)