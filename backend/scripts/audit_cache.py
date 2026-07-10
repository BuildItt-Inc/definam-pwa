# scripts/check_embeddings.py
import asyncio

from sqlalchemy import select

from app.db.database import db_session
from app.db.models import Topic


async def check():
    async with db_session() as session:
        result = await session.execute(select(Topic).where(Topic.status == 'published'))
        topics = result.scalars().all()
        missing = [t for t in topics if t.embedding is None]
        if missing:
            print(f'❌ {len(missing)} topics missing embeddings:')
            for t in missing:
                print(f'  - {t.title}')
        else:
            print('✅ All published topics have embeddings')

asyncio.run(check())