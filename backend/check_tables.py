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
        print("Tables in public schema:", tables)

        # If topics table exists, show its columns
        if "topics" in tables:
            inspector = inspect(conn)
            columns = [c["name"] for c in inspector.get_columns("topics")]
            print("\n📊 Topics columns:", columns)
        else:
            print("\n⚠️ Topics table not found yet. Waiting for Naga's migration.")


asyncio.run(check())
