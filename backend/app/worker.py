"""Arq worker configuration for background scheduled jobs (e.g. daily push notifications)."""

from __future__ import annotations

import logging
from typing import Any

from arq.connections import RedisSettings
from arq.cron import cron

from app.core.config import get_settings
from app.scripts.send_daily_pushes import (
    process_recall_notifications,
    process_streak_notifications,
)

logger = logging.getLogger(__name__)


async def run_daily_recall_job(ctx: dict[str, Any]) -> None:
    """Cron task wrapper for daily recall notifications."""
    logger.info("Starting scheduled daily recall notifications job...")
    await process_recall_notifications()
    logger.info("Daily recall notifications job completed.")


async def run_daily_streak_job(ctx: dict[str, Any]) -> None:
    """Cron task wrapper for daily streak notifications."""
    logger.info("Starting scheduled daily streak notifications job...")
    await process_streak_notifications()
    logger.info("Daily streak notifications job completed.")


async def startup(ctx: dict[str, Any]) -> None:
    """Worker startup hook."""
    logger.info("Arq worker process started successfully.")


async def shutdown(ctx: dict[str, Any]) -> None:
    """Worker shutdown hook."""
    logger.info("Arq worker process shutting down...")


settings = get_settings()


class WorkerSettings:
    """Arq worker configuration class."""

    functions = [run_daily_recall_job, run_daily_streak_job]
    cron_jobs = [
        # Run daily recall notifications at 08:00 AM UTC
        cron(run_daily_recall_job, hour=8, minute=0),
        # Run daily streak notifications at 08:05 AM UTC
        cron(run_daily_streak_job, hour=8, minute=5),
    ]
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    on_startup = startup
    on_shutdown = shutdown
