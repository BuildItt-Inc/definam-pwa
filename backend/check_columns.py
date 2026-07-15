import asyncio

from sqlalchemy import text

from app.db.database import db_session


async def check_users():
    async with db_session() as session:
        result = await session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users'"))
        cols = [row[0] for row in result.fetchall()]
        print('users columns:', cols)

async def check_access_codes():
    async with db_session() as session:
        result = await session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='access_codes'"))
        cols = [row[0] for row in result.fetchall()]
        print('access_codes columns:', cols)

async def main():
    await check_users()
    await check_access_codes()

asyncio.run(main())
