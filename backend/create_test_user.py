import asyncio
import uuid

from app.core.security import hash_password
from app.db.database import db_session
from app.db.models import User


async def create_user():
    async with db_session() as session:
        user = User(
            id=str(uuid.uuid4()),
            username='teststudent',
            password_hash=await hash_password('Test12345'),
            role='student_individual',
            org_id=None,
            device_fingerprint=None,
            force_password_change=False
        )
        session.add(user)
        await session.commit()
        print(f'✅ Created user: {user.username} (ID: {user.id})')
        print('🔑 Now login to get a token:')
        print('   POST /api/v1/auth/login')
        print('   {"username": "teststudent", "password": "Test12345"}')

asyncio.run(create_user())