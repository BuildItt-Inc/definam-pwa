#!/usr/bin/env python3
"""
Send daily recall push notifications to all students with due topics.
Run this script daily (e.g., at 8 AM) via a scheduler.
"""

import asyncio
from collections import defaultdict

from sqlalchemy import select

from app.db.database import db_session
from app.db.models import DailyRecallQueue, Topic, User
from app.services.push import send_daily_recall_push


async def send_pushes():
    async with db_session() as session:
        # Get all due topics for today
        result = await session.execute(
            select(DailyRecallQueue, Topic.title, User.id)
            .join(Topic, DailyRecallQueue.topic_id == Topic.id)
            .join(User, DailyRecallQueue.user_id == User.id)
            .where(DailyRecallQueue.due_date == date.today())
            .where(DailyRecallQueue.completed == 0)
        )
        rows = result.fetchall()
        # Group by user_id
        user_topics = defaultdict(list)
        for _queue, title, user_id in rows:
            user_topics[user_id].append(title)

        # Send notifications
        for user_id, titles in user_topics.items():
            try:
                send_daily_recall_push(user_id, titles)
                print(f"✅ Push sent to user {user_id}")
            except Exception as e:
                print(f"❌ Failed for {user_id}: {e}")

if __name__ == "__main__":
    from datetime import date
    asyncio.run(send_pushes())