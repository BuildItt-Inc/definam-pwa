"""Spaced-repetition recall endpoints (SM-2 algorithm)."""

from __future__ import annotations

import asyncio
import json
import uuid
from contextlib import suppress
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.api.deps import CurrentUserDep
from app.core.exceptions import BadRequestError, NotFoundError
from app.db.database import db_session
from app.db.models import Chapter, DailyRecallQueue, Subject, Topic, TopicReview
from app.services.sm2 import sm2_calculate

# Redis is optional — import best-effort so missing REDIS_URL doesn't crash startup
try:
    from app.services.redis_client import get_redis as _get_redis
    _REDIS_ENABLED = True
except Exception:  # noqa: BLE001
    _REDIS_ENABLED = False


def _try_get_redis():
    """Return a Redis client or None if Redis is not available."""
    if not _REDIS_ENABLED:
        return None
    try:
        return _get_redis()
    except Exception:  # noqa: BLE001
        return None

router = APIRouter(tags=["recall"])


class RecallRating(BaseModel):
    rating: int


# ── Step 4 write endpoint ──────────────────────────────────────────────────


class Step4ReviewPayload(BaseModel):
    accuracy_score: float | None = Field(default=None, ge=0.0, le=100.0)


@router.post("/topics/{topic_id}/review")
async def record_step4_attempt(
    topic_id: str,
    payload: Step4ReviewPayload,
    claims: CurrentUserDep,
) -> dict:
    """
    Record that the student completed Step 4 (practice questions) for a topic.

    Updates ``last_reviewed_at`` and records the ``accuracy_score`` if provided.
    SM-2 repetition counts are advanced only when the student submits a
    recall rating via ``POST /topics/{id}/recall``.
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
                accuracy_score=payload.accuracy_score,
            )
            session.add(review)
        else:
            review.last_reviewed_at = now
            if payload.accuracy_score is not None:
                review.accuracy_score = payload.accuracy_score

        await session.commit()

        return {
            "topic_id": topic_id,
            "repetitions": review.repetitions,
            "last_reviewed_at": review.last_reviewed_at.isoformat(),
            "ease_factor": review.ease_factor,
            "interval_days": review.interval_days,
            "accuracy_score": review.accuracy_score,
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

        # Mark the daily recall queue item as completed if it exists
        queue_result = await session.execute(
            select(DailyRecallQueue)
            .where(
                DailyRecallQueue.user_id == user_id,
                DailyRecallQueue.topic_id == str(topic_id),
                DailyRecallQueue.completed == 0
            )
            .order_by(DailyRecallQueue.due_date.asc())
        )
        queue_item = queue_result.scalars().first()
        if queue_item:
            queue_item.completed = 1
            queue_item.rating = rating
            queue_item.rated_at = now

        await session.commit()

    # Refresh Redis recall queue cache after commit (best-effort)
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


async def _refresh_recall_queue(user_id: str):
    """Compute due topics and cache the recall queue in Redis."""
    async with db_session() as session:
        now = datetime.now(UTC)
        result = await session.execute(
            select(
                TopicReview,
                Topic.title,
                Topic.recall_questions,
                Subject.name.label("subject_name")
            )
            .join(Topic, TopicReview.topic_id == Topic.id)
            .join(Chapter, Topic.chapter_id == Chapter.id)
            .join(Subject, Chapter.subject_id == Subject.id)
            .where(
                TopicReview.user_id == user_id,
                TopicReview.next_review_at <= now
            )
            .order_by(TopicReview.next_review_at.asc())
        )
        due_topics = []
        for review, title, recall_qs, subject_name in result:
            question = None
            model_answer = None
            if recall_qs and isinstance(recall_qs, dict):
                question = recall_qs.get("question")
                model_answer = recall_qs.get("model_answer")
            due_topics.append({
                "topic_id": review.topic_id,
                "title": title,
                "subject": subject_name,
                "question": question,
                "model_answer": model_answer,
                "next_review_at": review.next_review_at.isoformat() if review.next_review_at else None
            })

    r = _try_get_redis()
    if r is not None:
        with suppress(Exception):
            r.setex(f"recall_queue:{user_id}", 86400, json.dumps(due_topics))
    return due_topics


@router.get("/recall/queue")
@router.get("/student/recall/queue")
async def get_recall_queue(claims: CurrentUserDep) -> list[dict]:
    """Return the student's due recall topics, served from Redis cache when available."""
    user_id: str = claims["sub"]
    r = _try_get_redis()
    if r is not None:
        with suppress(Exception):
            cached = await asyncio.to_thread(r.get, f"recall_queue:{user_id}")
            if cached:
                return json.loads(cached)
    return await _refresh_recall_queue(user_id)