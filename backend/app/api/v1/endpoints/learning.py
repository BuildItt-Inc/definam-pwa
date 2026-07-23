import re
from typing import Any
from uuid import UUID

from fastapi import APIRouter

from app.api.deps import CurrentUserDep
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
    """List all subjects."""
    return await database.get_all_subjects()


@router.get("/subjects/{subject_id}/chapters")
async def get_subject_chapters(
    subject_id: UUID,
    _: CurrentUserDep,
) -> list[dict[str, Any]]:
    """List all chapters for a given subject."""
    return await database.get_chapters_by_subject(str(subject_id))


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
            re.search(r'\b\d+/\d+\b', step1_text)
            or re.search(r'\b[a-zA-Z\d\s\+\-\*\/]+=[a-zA-Z\d\s\+\-\*\/]+', step1_text)
        )
    ):
        has_plain_math = True


    # Lazy JIT generation: generate and cache content if missing or contains unformatted plain math
    content_missing = (
        not topic.get("content_step1")
        or topic.get("content_step1") == "Content is being prepared."
        or has_plain_math
        or regenerate
    )
    if content_missing:
        generated = await generate_all_topic_content(topic["title"])
        await database.update_topic_content(
            str(topic_id),
            generated["content_step1"],
            generated["content_step2"],
            generated["content_step3"],
            generated["practice_questions"],
        )
        topic.update(generated)


    return {
        "step1": {
            "title": "Simple Definition",
            "content": topic.get("content_step1"),
        },
        "step2": {
            "title": "Nigerian Example",
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
) -> dict[str, bool]:
    """
    Lightweight engagement ping — call when a student opens or progresses
    through a topic's learning steps. Not gated on completion; powers the
    streak so "showed up today" counts even without finishing a topic.
    Idempotent per (user, day), so it's cheap to call once per step viewed.
    """
    user_id: str = claims["sub"]
    async with db_session() as session:
        await touch_daily_activity(session, user_id)
        await session.commit()
    return {"ok": True}
