#!/usr/bin/env python3
"""
Create a test student user in the database for local development.
Run: python tests/create_test_user.py
"""

import asyncio
import os
import sys
import uuid
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

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
        print(f'[SUCCESS] Created user: {user.username} (ID: {user.id})')
        print('[INFO] Now login to get a token:')
        print('   POST /api/v1/auth/login')
        print('   {"username": "teststudent", "password": "Test12345"}')


if __name__ == "__main__":
    asyncio.run(create_user())
