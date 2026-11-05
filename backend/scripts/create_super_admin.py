#!/usr/bin/env python3
"""
Create or promote a user to the super_admin role.

Usage:
    python -m scripts.create_super_admin --username <username> --password <password> [--email <email>] [--name <name>]
"""

import argparse
import asyncio
import uuid

from sqlalchemy import select

from app.core.security import hash_password
from app.db.database import db_session
from app.db.models import User


async def create_or_promote_super_admin(
    username: str,
    password: str,
    email: str | None = None,
    name: str | None = None,
):
    async with db_session() as session:
        result = await session.execute(select(User).where(User.username == username))
        user = result.scalar_one_or_none()
        p_hash = await hash_password(password)

        if user:
            print(
                f"User '{username}' found. Promoting to super_admin role and updating password..."
            )
            user.role = "super_admin"
            user.password_hash = p_hash
            user.force_password_change = False
            if email:
                user.email = email
            if name:
                user.name = name
            await session.commit()
            print(f"✅ User '{username}' promoted to super_admin successfully.")
        else:
            print(f"Creating new super_admin user '{username}'...")
            new_user = User(
                id=str(uuid.uuid4()),
                username=username,
                email=email,
                name=name or username,
                password_hash=p_hash,
                role="super_admin",
                force_password_change=False,
            )
            session.add(new_user)
            await session.commit()
            print(f"✅ Super admin user '{username}' created successfully.")


def main():
    parser = argparse.ArgumentParser(
        description="Create or promote a super_admin user."
    )
    parser.add_argument(
        "--username", required=True, help="Username for the super admin"
    )
    parser.add_argument(
        "--password", required=True, help="Password for the super admin"
    )
    parser.add_argument("--email", help="Email for the super admin")
    parser.add_argument("--name", help="Display name for the super admin")

    args = parser.parse_args()
    asyncio.run(
        create_or_promote_super_admin(
            username=args.username,
            password=args.password,
            email=args.email,
            name=args.name,
        )
    )


if __name__ == "__main__":
    main()
