#!/usr/bin/env python3
"""
Inspect all tables in the public schema and show topics columns.
Run: python tests/check_tables.py
"""

import asyncio

from sqlalchemy import inspect, text

from app.db.session import _get_engine


async def check():
    engine = _get_engine()
    async with engine.connect() as conn:
        # List all tables
        result = await conn.execute(
            text("SELECT tablename FROM pg_tables WHERE schemaname='public'")
        )
        tables = [row[0] for row in result.fetchall()]
        print("[INFO] Tables in public schema:", tables)

        # If topics table exists, show its columns
        if "topics" in tables:
            def get_columns(sync_conn):
                inspector = inspect(sync_conn)
                return [c["name"] for c in inspector.get_columns("topics")]

            columns = await conn.run_sync(get_columns)
            print("\n[INFO] Topics columns:", columns)
        else:
            print("\n[WARN] Topics table not found yet.")


if __name__ == "__main__":
    asyncio.run(check())
