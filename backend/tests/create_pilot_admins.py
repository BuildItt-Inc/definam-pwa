#!/usr/bin/env python3
"""
CLI script to create a pilot school organization and its admin user.
Run: python tests/create_pilot_admins.py --school-name="DefinAm Pilot School" --email="pilot-admin@definam.ng" --seats=100
"""

import argparse
import asyncio
import uuid

from app.core.security import hash_password
from app.db.database import (
    create_org,
    create_student_user,
    get_school_by_email,
    get_user_by_username,
)


async def create_pilot(school_name: str, email: str, seats: int):
    # check if school exists
    existing_school = await get_school_by_email(email)
    if existing_school:
        org_id = (
            existing_school["id"]
            if isinstance(existing_school, dict)
            else existing_school.id
        )
        print(
            f"[INFO] School with email {email} already exists: {school_name} (ID: {org_id})"
        )
    else:
        org_id = await create_org(email=email, name=school_name, seat_count=seats)
        print(
            f"[SUCCESS] Created school organization: {school_name} (ID: {org_id}) with {seats} seats"
        )

    # check if user exists
    existing_user = await get_user_by_username(email)
    password = "PilotAdmin123!"
    if existing_user:
        print(
            f"[INFO] Admin user with email {email} already exists. Skipping user creation."
        )
    else:
        user_id = str(uuid.uuid4())
        await create_student_user(
            user_id=user_id,
            org_id=org_id,
            role="admin",
            username=email,
            password_hash=await hash_password(password),
            force_password_change=True,
        )
        print("[SUCCESS] Created pilot admin account:")
        print(f"   Email/Username: {email}")
        print(f"   Password:       {password}")
        print("   Role:           admin")
        print("   Force PW change: True")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create pilot school admin accounts.")
    parser.add_argument(
        "--school-name",
        type=str,
        default="DefinAm Pilot School",
        help="Name of the school",
    )
    parser.add_argument(
        "--email",
        type=str,
        default="pilot-admin@definam.ng",
        help="Admin email/username",
    )
    parser.add_argument(
        "--seats", type=str, default="100", help="Number of student seats"
    )

    args = parser.parse_args()
    asyncio.run(create_pilot(args.school_name, args.email, int(args.seats)))
