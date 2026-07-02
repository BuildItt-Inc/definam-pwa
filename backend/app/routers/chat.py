import asyncio
import json
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select

from app.core.auth import get_current_user
from app.db.database import db_session
from app.db.models import ChatMessage, Topic
from app.services.chat import stream_groq_response
from app.services.redis_client import get_redis
from app.services.usage import get_daily_usage, increment_daily_usage

router = APIRouter(prefix="/api/v1", tags=["chat"])

@router.get("/chat/stream")
async def chat_stream(
    topic_id: str,
    question: str,
    user=Depends(get_current_user)
):
    # 1. Rate limit check (Redis first, fallback to DB)
    redis = get_redis()
    key = f"chat:count:{user.id}:{datetime.now(UTC).date().isoformat()}"

    # Use to_thread for Redis (non-blocking)
    count = await asyncio.to_thread(redis.get, key)
    if count is None:
        # Redis miss – query DB
        count = await get_daily_usage(user.id)
        # Seed Redis unconditionally with the count (even if 0)
        await asyncio.to_thread(redis.setex, key, 86400, count)
    else:
        count = int(count)

    if count >= 50:
        raise HTTPException(429, "Daily message limit reached (50/day).")

    # 2. Retrieve topic context + chat history in a single session
    async with db_session() as session:
        # Get topic
        result = await session.execute(select(Topic).where(Topic.id == topic_id))
        topic = result.scalar_one_or_none()
        if not topic:
            raise HTTPException(404, "Topic not found")
        context = " ".join([
            topic.title or "",
            topic.content_step1 or "",
            topic.content_step2 or "",
            topic.content_step3 or ""
        ])

        # Get chat history (last 10 messages)
        result = await session.execute(
            select(ChatMessage)
            .where(ChatMessage.user_id == user.id, ChatMessage.topic_id == topic_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(10)
        )
        history = []
        for msg in result.scalars().all():
            history.append({"role": msg.role, "content": msg.content})
        history.reverse()

    # 3. Increment rate limit and log user message BEFORE streaming
    # This prevents TOCTOU race conditions and ensures proper error handling
    await asyncio.to_thread(redis.incr, key)
    await asyncio.to_thread(redis.expire, key, 86400)
    await increment_daily_usage(user.id)

    async with db_session() as session:
        user_msg = ChatMessage(
            user_id=user.id,
            topic_id=topic_id,
            role="user",
            content=question
        )
        session.add(user_msg)
        await session.commit()

    # 4. Stream Groq response
    async def generate():
        full_response = ""
        async for chunk in stream_groq_response(question, context, history):
            full_response += chunk
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"

        # Log assistant response
        async with db_session() as session:
            assistant_msg = ChatMessage(
                user_id=user.id,
                topic_id=topic_id,
                role="assistant",
                content=full_response
            )
            session.add(assistant_msg)
            await session.commit()

        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")