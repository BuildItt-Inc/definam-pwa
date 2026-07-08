"""AI chat streaming endpoint."""

from __future__ import annotations

import asyncio
import json
from datetime import UTC, datetime

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from sqlalchemy import select

from app.api.deps import CurrentUserDep
from app.core.exceptions import NotFoundError, RateLimitExceededError
from app.db.database import db_session
from app.db.models import ChatMessage, Topic
from app.services.chat import stream_groq_response
from app.services.redis_client import get_redis
from app.services.usage import get_daily_usage, increment_daily_usage

router = APIRouter(tags=["chat"])

_DAILY_CHAT_LIMIT = 50


@router.get("/chat/stream")
async def chat_stream(
    topic_id: str,
    question: str,
    claims: CurrentUserDep,
) -> StreamingResponse:
    """Stream an AI Socratic tutor response for a given topic and question."""
    user_id: str = claims["sub"]

    # 1. Rate limit check (Redis first, fallback to DB)
    redis = get_redis()
    key = f"chat:count:{user_id}:{datetime.now(UTC).date().isoformat()}"

    count = await asyncio.to_thread(redis.get, key)
    if count is None:
        count = await get_daily_usage(user_id)
        await asyncio.to_thread(redis.setex, key, 86400, count)
    else:
        count = int(count)

    if count >= _DAILY_CHAT_LIMIT:
        raise RateLimitExceededError(f"Daily message limit reached ({_DAILY_CHAT_LIMIT}/day).")

    # 2. Retrieve topic context + chat history in a single session
    async with db_session() as session:
        result = await session.execute(select(Topic).where(Topic.id == topic_id))
        topic = result.scalar_one_or_none()
        if not topic:
            raise NotFoundError("Topic not found.")
        context = " ".join([
            topic.title or "",
            topic.content_step1 or "",
            topic.content_step2 or "",
            topic.content_step3 or "",
        ])

        result = await session.execute(
            select(ChatMessage)
            .where(ChatMessage.user_id == user_id, ChatMessage.topic_id == topic_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(10)
        )
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in reversed(result.scalars().all())
        ]

    # 3. Increment rate limit counters and log user message BEFORE streaming
    #    (prevents TOCTOU race conditions)
    await asyncio.to_thread(redis.incr, key)
    await asyncio.to_thread(redis.expire, key, 86400)
    await increment_daily_usage(user_id)

    async with db_session() as session:
        session.add(ChatMessage(user_id=user_id, topic_id=topic_id, role="user", content=question))
        await session.commit()

    # 4. Stream Groq response
    async def generate():
        full_response = ""
        async for chunk in stream_groq_response(question, context, history):
            full_response += chunk
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"

        async with db_session() as session:
            session.add(
                ChatMessage(user_id=user_id, topic_id=topic_id, role="assistant", content=full_response)
            )
            await session.commit()

        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
