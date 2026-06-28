from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from datetime import date, timedelta
import json
from pydantic import BaseModel
from app.db.database import db_session
from app.db.models import TopicReview, Topic
from app.services.sm2 import sm2_calculate
from app.services.redis_client import get_redis
from app.core.auth import get_current_user

class RecallRating(BaseModel):
    rating: int

router = APIRouter(prefix="/api/v1", tags=["recall"])

@router.post("/topics/{topic_id}/recall")
async def submit_recall(
    topic_id: str,
    payload: RecallRating,
    user=Depends(get_current_user)
):
    rating = payload.rating

    async with db_session() as session:
        # Get existing review
        result = await session.execute(
            select(TopicReview).where(
                TopicReview.topic_id == topic_id,
                TopicReview.user_id == user.id
            )
        )
        review = result.scalar_one_or_none()

        if not review:
            # First time — initialise
            review = TopicReview(
                topic_id=topic_id,
                user_id=user.id,
                ease_factor=2.5,
                interval_days=1,
                repetitions=0,
                last_reviewed_at=date.today()
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
        review.next_review_at = date.today() + timedelta(days=new_interval)
        review.last_reviewed_at = date.today()

        await session.commit()

        # Refresh Redis cache
        await refresh_recall_queue(user.id)

        return {
            "topic_id": topic_id,
            "rating": rating,
            "ease_factor": new_ef,
            "interval_days": new_interval,
            "repetitions": new_reps,
            "next_review_at": review.next_review_at.isoformat()
        }

async def refresh_recall_queue(user_id: str):
    async with db_session() as session:
        result = await session.execute(
            select(TopicReview, Topic.title)
            .join(Topic, TopicReview.topic_id == Topic.id)
            .where(
                TopicReview.user_id == user_id,
                TopicReview.next_review_at <= date.today()
            )
            .order_by(TopicReview.next_review_at.asc())
        )
        due_topics = []
        for review, title in result:
            due_topics.append({
                "topic_id": review.topic_id,
                "title": title,
                "next_review_at": review.next_review_at.isoformat()
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