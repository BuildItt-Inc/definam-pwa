import re
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from fastapi import APIRouter

from app.api.deps import CurrentUserDep
from app.api.v1.endpoints.students import _compute_streak, _get_streak_active_days
from app.core.exceptions import NotFoundError
from app.db import database
from app.db.database import db_session
from app.services.activity import touch_daily_activity
from app.services.content_generator import generate_all_topic_content

router = APIRouter()


@router.get("/subjects")
async def get_subjects(
    _: CurrentUserDep,
) -> list[dict[str, Any]]:
    """List all subjects — one entry per unique subject name, deduplicated
    across the SS1/SS2/SS3 class-level rows behind it."""
    return await database.get_all_subjects()


@router.get("/subjects/by-name/{subject_name}/chapters")
async def get_subject_chapters_by_name(
    subject_name: str,
    _: CurrentUserDep,
) -> list[dict[str, Any]]:
    """List all chapters for a subject name, across every class-level row
    that shares it. Each chapter is annotated with its class_level."""
    return await database.get_chapters_by_subject_name(subject_name)


@router.get("/chapters/{chapter_id}/topics")
async def get_chapter_topics(
    chapter_id: UUID,
    _: CurrentUserDep,
) -> list[dict[str, Any]]:
    """List all topics for a given chapter. Only returns published topics."""
    return await database.get_topics_by_chapter(str(chapter_id), published_only=True)


@router.get("/topics/{topic_id}")
async def get_topic(
    topic_id: UUID,
    _: CurrentUserDep,
    regenerate: bool = False,
) -> dict[str, Any]:
    """Get a single topic. Returns 404 if not published."""
    topic = await database.get_topic_by_id(str(topic_id), published_only=True)
    if not topic:
        raise NotFoundError("Topic not found or not published.")

    # Auto-detect old plain-text math (e.g. 1/3, 3/4 or P = 500x - 8500) without LaTeX $ delimiters
    step1_text = topic.get("content_step1") or ""
    has_plain_math = False
    if (
        step1_text
        and "$" not in step1_text
        and (
            re.search(r"\b\d+/\d+\b", step1_text)
            or re.search(r"\b[a-zA-Z\d\s\+\-\*\/]+=[a-zA-Z\d\s\+\-\*\/]+", step1_text)
        )
    ):
        has_plain_math = True

    # Lazy JIT generation: generate and cache content if missing or contains unformatted plain math
    content_missing = (
        not topic.get("content_step1")
        or topic.get("content_step1") == "Content is being prepared."
        or not topic.get("recall_questions")
        or has_plain_math
        or regenerate
    )
    if content_missing:
        generated = await generate_all_topic_content(
            topic["title"], topic.get("subject_name")
        )
        await database.update_topic_content(
            str(topic_id),
            generated["content_step1"],
            generated["content_step2"],
            generated["content_step3"],
            generated["practice_questions"],
            generated.get("recall_questions"),
        )
        topic.update(generated)

    return {
        "step1": {
            "title": "Simple Explanation",
            "content": topic.get("content_step1"),
        },
        "step2": {
            "title": "Real-World Example",
            "content": topic.get("content_step2"),
        },
        "step3": {
            "title": "Visual Breakdown",
            "content": topic.get("content_step3"),
        },
        "practice_questions": topic.get("practice_questions") or [],
    }


@router.post("/topics/{topic_id}/activity")
async def ping_topic_activity(
    topic_id: UUID,
    claims: CurrentUserDep,
) -> dict[str, Any]:
    """
    Lightweight engagement ping — call when a student opens or progresses
    through a topic's learning steps. Not gated on completion; powers the
    streak so "showed up today" counts even without finishing a topic.
    Idempotent per (user, day), so it's cheap to call once per step viewed.

    ``streak_incremented_today`` is True only on the call that actually
    recorded today's first activity — the frontend's cue to fire the streak
    celebration, rather than polling the dashboard and guessing whether
    today already counted.
    """
    user_id: str = claims["sub"]
    async with db_session() as session:
        newly_recorded = await touch_daily_activity(session, user_id)
        await session.commit()
        active_days = await _get_streak_active_days(session, user_id)

    streak_days = _compute_streak(active_days, datetime.now(UTC).date())

    return {
        "ok": True,
        "streak_incremented_today": newly_recorded,
        "streak_days": streak_days,
    }
