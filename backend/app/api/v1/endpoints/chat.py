"""AI chat streaming endpoint."""

from __future__ import annotations

import asyncio
import json
from datetime import UTC, datetime

import anyio
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from sqlalchemy import delete, select

from app.api.deps import CurrentUserDep
from app.core.exceptions import NotFoundError, RateLimitExceededError
from app.db.database import db_session
from app.db.models import ChatMessage, Topic
from app.services.chat import stream_groq_response
from app.services.redis_client import get_redis
from app.services.usage import get_daily_usage, increment_daily_usage

router = APIRouter(tags=["chat"])

_DAILY_CHAT_LIMIT = 50


@router.get("/chat/history")
async def chat_history(
    claims: CurrentUserDep,
    topic_id: str | None = None,
) -> list[dict]:
    """Retrieve chat message history for a topic, or the general (no-topic)
    floating-chat history when topic_id is omitted."""
    user_id: str = claims["sub"]
    async with db_session() as session:
        result = await session.execute(
            select(ChatMessage)
            .where(ChatMessage.user_id == user_id, ChatMessage.topic_id == topic_id)
            .order_by(ChatMessage.created_at.asc())
            .limit(20)
        )
        return [
            {"role": msg.role, "content": msg.content}
            for msg in result.scalars().all()
        ]


@router.delete("/chat/history")
async def clear_chat_history(
    claims: CurrentUserDep,
    topic_id: str | None = None,
) -> dict:
    """Delete a student's chat history for a topic, or the general (no-topic)
    floating-chat history when topic_id is omitted. Scoped the same way as
    GET /chat/history — clears only the conversation currently in view."""
    user_id: str = claims["sub"]
    async with db_session() as session:
        await session.execute(
            delete(ChatMessage).where(
                ChatMessage.user_id == user_id, ChatMessage.topic_id == topic_id
            )
        )
        await session.commit()
    return {"ok": True}


@router.get("/chat/stream")
async def chat_stream(
    question: str,
    claims: CurrentUserDep,
    topic_id: str | None = None,
) -> StreamingResponse:
    """Stream an AI Socratic tutor response.

    With topic_id: contextual chat scoped to that topic (per-topic Step 5
    chat). Without it: the general floating chat, no topic context. Both
    share the same daily rate limit and history table (topic_id IS NULL
    for general chat) — this is one feature with two entry points, not two
    separate chat systems.
    """
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

    # 2. Retrieve topic context (if any) + chat history in a single session
    async with db_session() as session:
        context = ""
        if topic_id:
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
        usage_input_tokens = 0
        usage_output_tokens = 0

        try:
            async for item in stream_groq_response(question, context, history):
                if item[0] == "chunk":
                    full_response += item[1]
                    yield f"data: {json.dumps({'chunk': item[1]})}\n\n"
                elif item[0] == "usage":
                    usage_input_tokens = item[1]["input_tokens"]
                    usage_output_tokens = item[1]["output_tokens"]
        finally:
            # Runs even if the client disconnects mid-stream (e.g. a page
            # refresh) — Starlette cancels this generator on disconnect, which
            # would otherwise silently drop whatever the model had generated
            # so far, leaving the student's question saved with no reply.
            # Shielded because the enclosing scope is already cancelled at
            # that point; an unshielded await here would be cancelled too.
            if full_response:
                with anyio.CancelScope(shield=True):
                    async with db_session() as session:
                        session.add(
                            ChatMessage(
                                user_id=user_id,
                                topic_id=topic_id,
                                role="assistant",
                                content=full_response,
                                input_tokens=usage_input_tokens,
                                output_tokens=usage_output_tokens,
                            )
                        )
                        await session.commit()

        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")