"""Send daily FCM and OneSignal push notifications to all students for recall and streak reminders.

Run this script daily (e.g., at 8 AM) via a scheduler.
"""

import asyncio
import logging
from collections import defaultdict
from datetime import date, timedelta

import httpx
from sqlalchemy import Date, and_, cast, select

from app.db.database import db_session
from app.db.models import DailyActivity, DailyRecallQueue, Topic, User
from app.services.fcm import send_multicast_fcm
from app.services.push import send_daily_recall_push

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _compute_streak(days_desc: list[date], today_val: date) -> int:
    """Calculate consecutive active days ending yesterday or today."""
    if not days_desc:
        return 0

    streak = 0
    expected = today_val

    for d in days_desc:
        if d == expected:
            streak += 1
            expected = d - timedelta(days=1)
        elif streak == 0 and d == today_val - timedelta(days=1):
            # Allow streak starting from yesterday if no session yet today
            streak += 1
            expected = d - timedelta(days=1)
        else:
            break

    return streak


async def process_recall_notifications():
    """Send daily recall queue reminders."""
    today_val = date.today()
    logger.info("Processing recall notifications for %s...", today_val)

    async with db_session() as session:
        result = await session.execute(
            select(DailyRecallQueue, Topic.title, User.id)
            .join(Topic, DailyRecallQueue.topic_id == Topic.id)
            .join(User, DailyRecallQueue.user_id == User.id)
            .where(cast(DailyRecallQueue.due_date, Date) == today_val)
            .where(DailyRecallQueue.completed == 0)
        )
        rows = result.fetchall()

    user_topics = defaultdict(list)
    for _queue, title, user_id in rows:
        user_topics[user_id].append(title)

    if not user_topics:
        logger.info("No due recall topics today.")
        return

    # 1. Send via FCM
    fcm_success = 0
    fcm_skipped_or_failed = []

    for user_id, titles in user_topics.items():
        message = f"You have {len(titles)} topics to review today: " + ", ".join(
            titles[:3]
        )
        if len(titles) > 3:
            message += f" and {len(titles) - 3} more."

        fcm_res = await send_multicast_fcm(
            user_ids=[user_id],
            title="📚 Daily Review Reminder",
            body=message,
            data={"type": "recall"},
        )
        if fcm_res.get("success_count", 0) > 0:
            fcm_success += 1
        else:
            fcm_skipped_or_failed.append((user_id, titles))

    logger.info("FCM Recall Reminders complete. Sent to %d users.", fcm_success)

    # 2. Fallback to OneSignal for users who don't have FCM or as dual-delivery
    if fcm_skipped_or_failed:
        logger.info(
            "Attempting OneSignal delivery for %d users...",
            len(fcm_skipped_or_failed),
        )
        async with httpx.AsyncClient() as client:
            for user_id, titles in fcm_skipped_or_failed:
                try:
                    await send_daily_recall_push(user_id, titles, client=client)
                except Exception as e:
                    logger.error(
                        "OneSignal recall push failed for user %s: %s", user_id, e
                    )


async def process_streak_notifications():
    """Send daily streak reminders to users at risk of losing their streak."""
    today_val = date.today()
    yesterday = today_val - timedelta(days=1)
    logger.info("Processing streak warnings for %s...", today_val)

    async with db_session() as session:
        # Find users active yesterday but not active today
        users_active_yesterday = select(DailyActivity.user_id).where(
            DailyActivity.activity_date == yesterday
        )
        users_active_today = select(DailyActivity.user_id).where(
            DailyActivity.activity_date == today_val
        )

        at_risk_users_result = await session.execute(
            select(User.id, User.name).where(
                and_(
                    User.id.in_(users_active_yesterday),
                    User.id.not_in(users_active_today),
                )
            )
        )
        at_risk_users = at_risk_users_result.fetchall()

        if not at_risk_users:
            logger.info("No users at risk of losing streak today.")
            return

        for user_id, name in at_risk_users:
            # Fetch all past active dates to compute streak
            activity_result = await session.execute(
                select(DailyActivity.activity_date)
                .where(DailyActivity.user_id == user_id)
                .order_by(DailyActivity.activity_date.desc())
            )
            active_dates = [r[0] for r in activity_result.fetchall()]

            streak_count = _compute_streak(active_dates, today_val)
            if streak_count >= 1:
                # User has an active streak and has not logged in today
                display_name = name or "Student"
                title = "🔥 Keep your streak alive!"
                body = (
                    f"Hi {display_name}, you have a {streak_count}-day learning streak going! "
                    "Don't lose it — open DefinAm and complete today's review or topic."
                )

                fcm_res = await send_multicast_fcm(
                    user_ids=[user_id],
                    title=title,
                    body=body,
                    data={"type": "streak", "streak": str(streak_count)},
                )

                if fcm_res.get("success_count", 0) > 0:
                    logger.info(
                        "Sent FCM streak warning to user %s (%d days)",
                        user_id,
                        streak_count,
                    )
                else:
                    # OneSignal fallback for streak reminders
                    try:
                        # Attempt to construct OneSignal payload manually
                        from app.core.config import get_settings

                        settings = get_settings()
                        payload = {
                            "app_id": settings.onesignal_app_id,
                            "include_external_user_ids": [user_id],
                            "contents": {"en": body},
                            "headings": {"en": title},
                            "data": {"type": "streak", "streak": str(streak_count)},
                        }
                        headers = {
                            "Authorization": f"Basic {settings.onesignal_api_key}"
                        }
                        async with httpx.AsyncClient() as client:
                            response = await client.post(
                                "https://onesignal.com/api/v1/notifications",
                                json=payload,
                                headers=headers,
                            )
                            if response.status_code == 200:
                                logger.info(
                                    "Sent OneSignal streak warning to user %s",
                                    user_id,
                                )
                    except Exception as e:
                        logger.error(
                            "Failed OneSignal streak warning for user %s: %s",
                            user_id,
                            e,
                        )


async def main():
    await process_recall_notifications()
    await process_streak_notifications()


if __name__ == "__main__":
    asyncio.run(main())
