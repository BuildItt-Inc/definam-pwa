from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter

from app.core.exceptions import NotFoundError

from app.api.deps import CurrentUserDep
from app.db import database

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
) -> dict[str, Any]:
    """Get a single topic. Returns 404 if not published."""
    topic = await database.get_topic_by_id(str(topic_id), published_only=True)
    if not topic:
        raise NotFoundError("Topic not found or not published.")
    return topic
