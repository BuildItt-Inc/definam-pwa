#!/usr/bin/env python3
"""
Sanity-check the database connection.
Run: python tests/test_db.py
"""

import asyncio

from sqlalchemy import text

from app.core.config import get_settings
from app.db.session import _get_engine


async def check_connection():
    settings = get_settings()
    print(
        f"Connecting to: {settings.database_url.replace(settings.database_url.split('@')[0].split(':')[2], '***')}"
    )

    engine = _get_engine()
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT 1"))
        print("[SUCCESS] Database connected! Result:", result.scalar())


if __name__ == "__main__":
    asyncio.run(check_connection())
