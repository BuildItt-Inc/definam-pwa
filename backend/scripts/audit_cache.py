#!/usr/bin/env python3
"""
Audit Redis cache hit rate for topic content.
Run: python -m scripts.audit_cache
"""

import asyncio

from sqlalchemy import select

from app.db.database import db_session
from app.db.models import Topic
from app.services.redis_client import get_redis


async def audit_cache():
    redis = get_redis()
    async with db_session() as session:
        result = await session.execute(select(Topic))
        topics = result.scalars().all()
        hits = 0
        misses = 0
        for topic in topics:
            key = f"topic:{topic.id}:steps_content"
            data = redis.get(key)
            if data:
                hits += 1
            else:
                misses += 1
        total = hits + misses
        hit_rate = (hits / total * 100) if total > 0 else 0
        print(f"Cache hit rate: {hit_rate:.2f}% ({hits} hits, {misses} misses)")
        if misses > 0:
            print("Topics missing from cache:")
            for topic in topics:
                key = f"topic:{topic.id}:steps_content"
                if not redis.get(key):
                    print(f"  - {topic.id} ({topic.title})")

if __name__ == "__main__":
    asyncio.run(audit_cache())
