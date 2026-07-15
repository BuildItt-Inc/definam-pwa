# scripts/create_test_code.py
import asyncio
import uuid

from app.db.database import db_session
from app.db.models import AccessCode


async def create_code():
    async with db_session() as session:
        code = AccessCode(
            id=str(uuid.uuid4()),
            code="TEST-1234-XY",
            type="individual",
            status="pending",
            email="testuser@example.com",  # <-- email
            school_id=None,
        )
        session.add(code)
        await session.commit()
        print("✅ Test access code created: TEST-1234-XY with email testuser@example.com")

asyncio.run(create_code())