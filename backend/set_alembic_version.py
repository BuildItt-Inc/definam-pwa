import asyncio

from sqlalchemy import text

from app.db.database import db_session


async def set_version():
    async with db_session() as session:
        await session.execute(text("DELETE FROM alembic_version"))
        await session.execute(
            text("INSERT INTO alembic_version (version_num) VALUES ('7e0d385e1fe8')")
        )
        await session.commit()
        print("✅ Alembic version set to 7e0d385e1fe8")


asyncio.run(set_version())
