"""Spaced-repetition recall endpoints (SM-2 algorithm)."""

from __future__ import annotations

import asyncio
import json
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import select

from app.api.deps import CurrentUserDep
from app.core.exceptions import BadRequestError, NotFoundError
from app.db.database import db_session
from app.db.models import Topic, TopicReview
from app.services.redis_client import get_redis
from app.services.sm2 import sm2_calculate

router = APIRouter(tags=["recall"])


class RecallRating(BaseModel):
    rating: int


# ── Step 4 write endpoint ──────────────────────────────────────────────────


@router.post("/topics/{topic_id}/review")
async def record_step4_attempt(
    topic_id: str,
    claims: CurrentUserDep,
) -> dict:
    """
    Record that the student completed Step 4 (practice questions) for a topic.

    Updates ``last_reviewed_at``. SM-2 repetition counts are advanced only
    when the student submits a recall rating via ``POST /topics/{id}/recall``.
    """
    try:
        uuid.UUID(topic_id)
    except ValueError:
        raise BadRequestError("Invalid topic ID format.") from None

    user_id: str = claims["sub"]
    now = datetime.now(UTC)

    async with db_session() as session:
        topic_exists = await session.execute(
            select(Topic.id).where(Topic.id == topic_id)
        )
        if not topic_exists.scalar_one_or_none():
            raise NotFoundError("Topic not found.")

        result = await session.execute(
            select(TopicReview).where(
                TopicReview.topic_id == topic_id,
                TopicReview.user_id == user_id,
            )
        )
        review = result.scalar_one_or_none()

        if not review:
            review = TopicReview(
                topic_id=topic_id,
                user_id=user_id,
                ease_factor=2.5,
                interval_days=1,
                repetitions=0,
                last_reviewed_at=now,
            )
            session.add(review)
        else:
            review.last_reviewed_at = now

        await session.commit()

        return {
            "topic_id": topic_id,
            "repetitions": review.repetitions,
            "last_reviewed_at": review.last_reviewed_at.isoformat(),
            "ease_factor": review.ease_factor,
            "interval_days": review.interval_days,
        }


# ── SM-2 recall endpoint ───────────────────────────────────────────────────


@router.post("/topics/{topic_id}/recall")
async def submit_recall(
    topic_id: uuid.UUID,
    payload: RecallRating,
    claims: CurrentUserDep,
) -> dict:
    """Submit a recall rating (0–5) for a topic and advance SM-2 scheduling."""
    rating = payload.rating
    if not 0 <= rating <= 5:
        raise BadRequestError("Rating must be between 0 and 5.")

    user_id: str = claims["sub"]

    async with db_session() as session:
        topic_exists = await session.execute(
            select(Topic.id).where(Topic.id == str(topic_id))
        )
        if not topic_exists.scalar_one_or_none():
            raise NotFoundError("Topic not found.")

        result = await session.execute(
            select(TopicReview).where(
                TopicReview.topic_id == str(topic_id),
                TopicReview.user_id == user_id,
            )
        )
        review = result.scalar_one_or_none()

        now = datetime.now(UTC)

        if not review:
            review = TopicReview(
                topic_id=str(topic_id),
                user_id=user_id,
                ease_factor=2.5,
                interval_days=1,
                repetitions=0,
                last_reviewed_at=now,
            )
            session.add(review)
            await session.flush()

        new_ef, new_interval, new_reps = sm2_calculate(
            rating=rating,
            ease_factor=review.ease_factor,
            interval=review.interval_days,
            repetitions=review.repetitions,
        )

        review.ease_factor = new_ef
        review.interval_days = new_interval
        review.repetitions = new_reps
        review.next_review_at = now + timedelta(days=new_interval)
        review.last_reviewed_at = now

        await session.commit()

    # Refresh Redis recall queue cache after commit
    await _refresh_recall_queue(user_id)

    return {
        "topic_id": str(topic_id),
        "rating": rating,
        "ease_factor": new_ef,
        "interval_days": new_interval,
        "repetitions": new_reps,
        "next_review_at": review.next_review_at.isoformat() if review.next_review_at else now.isoformat(),
    }


# ── Recall queue helpers ───────────────────────────────────────────────────


async def _refresh_recall_queue(user_id: str) -> list[dict]:
    """Rebuild and cache the due-topic queue for a student."""
    async with db_session() as session:
        now = datetime.now(UTC)
        result = await session.execute(
            select(TopicReview, Topic.title)
            .join(Topic, TopicReview.topic_id == Topic.id)
            .where(
                TopicReview.user_id == user_id,
                TopicReview.next_review_at <= now,
            )
            .order_by(TopicReview.next_review_at.asc())
        )
        due_topics = [
            {
                "topic_id": review.topic_id,
                "title": title,
                "next_review_at": review.next_review_at.isoformat() if review.next_review_at else None,
            }
            for review, title in result
        ]

    r = get_redis()
    await asyncio.to_thread(r.setex, f"recall_queue:{user_id}", 86400, json.dumps(due_topics))
    return due_topics


@router.get("/recall/queue")
async def get_recall_queue(claims: CurrentUserDep) -> list[dict]:
    """Return the student's due recall topics, served from Redis cache when available."""
    user_id: str = claims["sub"]
    r = get_redis()
    cached = await asyncio.to_thread(r.get, f"recall_queue:{user_id}")
    if cached:
        return json.loads(cached)
    return await _refresh_recall_queue(user_id)
