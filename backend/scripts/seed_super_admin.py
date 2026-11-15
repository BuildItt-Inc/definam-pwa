"""Idempotent seed script: create the first super admin from environment variables.

Coolify / Production deployment instructions:
1. In the Coolify service dashboard (or environment configuration), add the environment variables:
     SUPER_ADMIN_EMAIL=admin@recallr.org
     SUPER_ADMIN_INITIAL_PASSWORD=<strong-random-password>
2. In the Coolify terminal for the application container, run once:
     python backend/scripts/seed_super_admin.py
3. Once completed successfully, immediately remove the SUPER_ADMIN_INITIAL_PASSWORD
   variable from the Coolify dashboard so plaintext credentials do not persist in configuration.

Security notes:
- The script automatically normalizes the email (lowercase, trimmed) and uses it as the username.
- force_password_change is set to True, requiring the super admin to choose a new password upon first login.
- The script is completely idempotent: if any user with role='super_admin' already exists, it is a safe no-op.
- Never pass passwords as command-line arguments in scripts or terminal history.
"""

from __future__ import annotations

import asyncio
import logging
import os
import sys
import uuid
from pathlib import Path

# Allow running from repo root: `python backend/scripts/seed_super_admin.py`
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.security import hash_password
from app.db.models import User

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("seed_super_admin")


async def seed() -> None:
    email = os.environ.get("SUPER_ADMIN_EMAIL", "").strip().lower()
    password = os.environ.get("SUPER_ADMIN_INITIAL_PASSWORD", "").strip()
    db_url = os.environ.get("DATABASE_URL", "")

    missing = [
        k
        for k, v in [
            ("SUPER_ADMIN_EMAIL", email),
            ("SUPER_ADMIN_INITIAL_PASSWORD", password),
            ("DATABASE_URL", db_url),
        ]
        if not v
    ]

    if missing:
        log.error("Missing required environment variables: %s", ", ".join(missing))
        sys.exit(1)

    engine = create_async_engine(db_url, echo=False)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async with Session() as session:
        # 1. Idempotency check: if any super admin exists, safe no-op.
        result = await session.execute(
            select(func.count(User.id)).where(User.role == "super_admin")
        )
        count = result.scalar_one()
        if count > 0:
            log.info("SKIP — %d super admin(s) already exist. Nothing changed.", count)
            await engine.dispose()
            return

        # 2. Case-insensitive collision check on email and username against existing accounts.
        collision = await session.execute(
            select(User.id).where(
                or_(
                    func.lower(User.email) == email,
                    func.lower(User.username) == email,
                )
            )
        )
        if collision.scalar_one_or_none() is not None:
            log.error(
                "ERROR — An existing user with this email or username already exists. Aborting seed."
            )
            await engine.dispose()
            sys.exit(1)

        # 3. Create super admin account using normalized email as username.
        hashed = await hash_password(password)
        user = User(
            id=str(uuid.uuid4()),
            username=email,  # Set username to normalized email
            email=email,
            name=email.split("@")[0],
            password_hash=hashed,
            role="super_admin",
            force_password_change=True,
        )
        session.add(user)

        try:
            await session.commit()
        except IntegrityError as exc:
            await session.rollback()
            log.error("ERROR — Integrity error creating super admin: %s", exc)
            await engine.dispose()
            sys.exit(1)

    log.info(
        "DONE — Super admin '%s' created successfully. force_password_change=True.",
        email,
    )
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
