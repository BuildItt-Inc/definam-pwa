"""
Idempotent seed script: create the first super admin from environment variables.

Usage:
    PYTHONPATH=backend SUPER_ADMIN_EMAIL=... SUPER_ADMIN_USERNAME=... \
    SUPER_ADMIN_INITIAL_PASSWORD=... \
    DATABASE_URL=postgresql+asyncpg://... \
    python backend/scripts/seed_super_admin.py

Environment variables:
    SUPER_ADMIN_EMAIL              Required. Email for the first super admin.
    SUPER_ADMIN_USERNAME           Required. Username (login identifier).
    SUPER_ADMIN_INITIAL_PASSWORD   Required. Password (force_password_change is set to True).
    DATABASE_URL                   Required if not in .env / environment already.

The script is a no-op if any user with role='super_admin' already exists, so it
is safe to run on every deploy (e.g. from a Coolify pre-deploy hook or startup
script).  It logs one of three outcomes:
    - SKIP  — a super admin already exists, nothing changed.
    - DONE  — first super admin created; must change password on first login.
    - ERROR — missing env vars or database error (exits with code 1).
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

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.security import hash_password
from app.db.models import User

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("seed_super_admin")


async def seed() -> None:
    email = os.environ.get("SUPER_ADMIN_EMAIL", "").strip().lower()
    username = os.environ.get("SUPER_ADMIN_USERNAME", "").strip()
    password = os.environ.get("SUPER_ADMIN_INITIAL_PASSWORD", "").strip()
    db_url = os.environ.get("DATABASE_URL", "")

    missing = [
        k
        for k, v in [
            ("SUPER_ADMIN_EMAIL", email),
            ("SUPER_ADMIN_USERNAME", username),
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
        # Check whether a super admin already exists (no-op guard).
        result = await session.execute(
            select(func.count(User.id)).where(User.role == "super_admin")
        )
        count = result.scalar_one()
        if count > 0:
            log.info("SKIP — %d super admin(s) already exist. Nothing changed.", count)
            await engine.dispose()
            return

        hashed = await hash_password(password)
        user = User(
            id=str(uuid.uuid4()),
            username=username,
            email=email,
            name=None,
            password_hash=hashed,
            role="super_admin",
            force_password_change=True,
        )
        session.add(user)
        await session.commit()

    log.info(
        "DONE — Super admin '%s' (%s) created. force_password_change=True.",
        username,
        email,
    )
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
