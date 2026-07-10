# scripts/qa_check.py
import asyncio

from sqlalchemy import select

from app.db.database import db_session
from app.db.models import Topic
from app.services.redis_client import get_topic_content


async def qa():
    async with db_session() as session:
        result = await session.execute(select(Topic).where(Topic.status == 'published'))
        topics = result.scalars().all()
        print(f"\n🔍 Checking {len(topics)} topics...\n")
        for t in topics:
            content = get_topic_content(t.id)
            if content:
                print(f"=== {t.title} ===")
                print(f"Step 1: {content.get('step1', '')[:200]}...")
                print(f"Step 2: {content.get('step2', '')[:200]}...")
                print(f"Step 3: {content.get('step3', '')[:200]}...")
                # Check practice question
                if 'step3' in content and content['step3']:
                    # The practice question is in step3 as JSON, but we stored it as raw text
                    # We'll just show a snippet
                    print(f"Practice Q: {content.get('step3', '')[:100]}...")
                print("-" * 40)
            else:
                print(f"❌ {t.title}: No content in cache")

if __name__ == "__main__":
    asyncio.run(qa())