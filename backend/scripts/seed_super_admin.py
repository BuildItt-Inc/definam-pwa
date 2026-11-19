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
- If a super admin already exists, the script syncs their password from SUPER_ADMIN_INITIAL_PASSWORD on every boot.
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


def _clear_redis_lockout(email: str) -> None:
    """Best-effort: delete Redis rate-limit keys for the super admin email.
    Silently skips if Redis is unreachable or not configured."""
    redis_url = os.environ.get("REDIS_URL", "").strip()
    if not redis_url:
        return
    try:
        import redis as _redis

        r = _redis.from_url(redis_url, decode_responses=True, socket_timeout=2.0)
        deleted = r.delete(f"sa_fail_cred:{email}")
        log.info(
            "LOCKOUT — Cleared Redis rate-limit key for '%s' (deleted=%d).", email, deleted
        )
    except Exception as exc:  # noqa: BLE001
        log.warning("LOCKOUT — Could not clear Redis lockout (non-fatal): %s", exc)


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
        # 1. If a super admin already exists, always sync the password from env var.
        result = await session.execute(
            select(func.count(User.id)).where(User.role == "super_admin")
        )
        count = result.scalar_one()
        if count > 0:
            # Fetch the first super admin and update their password from env var.
            sa_result = await session.execute(
                select(User).where(User.role == "super_admin").limit(1)
            )
            sa_user = sa_result.scalar_one_or_none()
            if sa_user:
                sa_user.password_hash = await hash_password(password)
                await session.commit()
                log.info(
                    "UPDATED — Super admin '%s' password synced from env var.",
                    sa_user.email or sa_user.username,
                )
                _clear_redis_lockout(sa_user.email or sa_user.username)
            else:
                log.info("SKIP — Count >0 but no row found (unexpected). Skipping.")
            await engine.dispose()
            return

        # 2. Check if an account with this email or username already exists.
        collision = await session.execute(
            select(User).where(
                or_(
                    func.lower(User.email) == email,
                    func.lower(User.username) == email,
                )
            )
        )
        existing_user = collision.scalar_one_or_none()
        if existing_user is not None:
            log.info(
                "NOTICE — Account '%s' already exists with role '%s'. Promoting to 'super_admin'...",
                existing_user.username,
                existing_user.role,
            )
            existing_user.role = "super_admin"
            existing_user.password_hash = await hash_password(password)
            existing_user.force_password_change = False
            await session.commit()
            log.info(
                "DONE — Existing user '%s' promoted to 'super_admin' successfully.",
                existing_user.username,
            )
            _clear_redis_lockout(existing_user.email or existing_user.username)
            await engine.dispose()
            return

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
