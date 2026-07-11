#!/usr/bin/env python3
"""
Seed a test school and a school-scoped admin account for Postman/manual testing.

Run from the backend/ directory:
    python scripts/create_test_admin.py

Credentials created:
    School:   Kings Secondary School (test-school@definam.ng)
    Admin:    username=testadmin  password=Admin12345
"""

import asyncio
import uuid

from app.core.security import hash_password
from app.db.database import db_session
from app.db.models import AccessCode, School, User

SCHOOL_EMAIL = "test-school@definam.ng"
SCHOOL_NAME = "Kings Secondary School"
ADMIN_USERNAME = "testadmin"
ADMIN_PASSWORD = "Admin12345"


async def seed():
    async with db_session() as session:
        # ── School ─────────────────────────────────────────────────────────
        from sqlalchemy import select

        existing_school = (
            await session.execute(select(School).where(School.email == SCHOOL_EMAIL))
        ).scalar_one_or_none()

        if existing_school:
            school_id = existing_school.id
            print(f"[SKIP]    School already exists (ID: {school_id})")
        else:
            school_id = str(uuid.uuid4())
            session.add(
                School(
                    id=school_id,
                    email=SCHOOL_EMAIL,
                    name=SCHOOL_NAME,
                    active_seats=50,
                )
            )
            await session.flush()
            print(f"[SUCCESS] Created school: {SCHOOL_NAME} (ID: {school_id})")

        # ── Seed a few org access codes so SCR-12 table is non-empty ───────
        existing_codes = (
            await session.execute(
                select(AccessCode).where(AccessCode.school_id == school_id).limit(1)
            )
        ).scalar_one_or_none()

        if not existing_codes:
            codes = [
                AccessCode(
                    id=str(uuid.uuid4()),
                    code=f"DA-TEST-{i:04d}",
                    type="org",
                    status="pending",
                    school_id=school_id,
                )
                for i in range(1, 11)
            ]
            session.add_all(codes)
            print(f"[SUCCESS] Seeded 10 org access codes for school")

        # ── Admin user ─────────────────────────────────────────────────────
        existing_admin = (
            await session.execute(
                select(User).where(User.username == ADMIN_USERNAME)
            )
        ).scalar_one_or_none()

        if existing_admin:
            print(f"[SKIP]    Admin user already exists (ID: {existing_admin.id})")
        else:
            admin = User(
                id=str(uuid.uuid4()),
                username=ADMIN_USERNAME,
                password_hash=await hash_password(ADMIN_PASSWORD),
                role="admin",
                org_id=school_id,
                device_fingerprint=None,
                force_password_change=False,
            )
            session.add(admin)
            await session.flush()
            print(f"[SUCCESS] Created admin: {ADMIN_USERNAME} (ID: {admin.id})")

        await session.commit()

    print("\n── Test Accounts ──────────────────────────────────────────────")
    print("Student  →  POST /api/v1/auth/login")
    print('           {"username": "teststudent", "password": "Test12345"}')
    print()
    print("Admin    →  POST /api/v1/auth/login")
    print(f'           {{"username": "{ADMIN_USERNAME}", "password": "{ADMIN_PASSWORD}"}}')
    print()
    print("── Key Endpoints to Test ──────────────────────────────────────")
    print("GET  /api/v1/students/dashboard          (student token)")
    print("GET  /api/v1/admin/codes                 (admin token)")
    print("GET  /api/v1/admin/students/{student_id} (admin token)")


if __name__ == "__main__":
    asyncio.run(seed())
