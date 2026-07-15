#!/usr/bin/env python3
"""
Create a school record for the pilot.
Run: python -m scripts.create_school
"""

import asyncio
import uuid

from app.db.database import db_session
from app.db.models import School


async def create_school():
    async with db_session() as session:
        school = School(
            id=str(uuid.uuid4()),
            email="pilot@school.edu.ng",
            name="Pilot School",
            active_seats=100  # adjust as needed
        )
        session.add(school)
        await session.commit()
        print(f"✅ School created with ID: {school.id}")
        print(f"   Name: {school.name}")
        print(f"   Email: {school.email}")
        print(f"   Active seats: {school.active_seats}")

if __name__ == "__main__":
    asyncio.run(create_school())