#!/usr/bin/env python3
"""
Promote an existing user to super_admin role.

Run this on the production server (Coolify) where the backend is deployed:

    cd /path/to/backend
    python -m scripts.promote_to_super_admin --username francisnaga

Or with a password reset:

    python -m scripts.promote_to_super_admin --username francisnaga --new-password "YourNewPass123!"
"""

import argparse
import asyncio

from sqlalchemy import select

from app.db.database import db_session
from app.db.models import User


async def promote_user(username: str, new_password: str | None = None):
    async with db_session() as session:
        result = await session.execute(select(User).where(User.username == username))
        user = result.scalar_one_or_none()

        if not user:
            print(f"❌  User '{username}' not found in the database.")
            return

        old_role = user.role
        user.role = "super_admin"
        user.force_password_change = False

        if new_password:
            from app.core.security import hash_password
            user.password_hash = await hash_password(new_password)
            print(f"   Password also updated.")

        await session.commit()
        print(f"✅  User '{username}' promoted: {old_role} → super_admin")
        print(f"   User ID : {user.id}")
        print(f"   Email   : {user.email or '(none)'}")


def main():
    parser = argparse.ArgumentParser(description="Promote a user to super_admin.")
    parser.add_argument("--username", required=True, help="The username to promote")
    parser.add_argument("--new-password", default=None, help="Optional: reset their password too")
    args = parser.parse_args()
    asyncio.run(promote_user(args.username, args.new_password))


if __name__ == "__main__":
    main()
