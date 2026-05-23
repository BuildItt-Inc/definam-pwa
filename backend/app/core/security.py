from __future__ import annotations

import hashlib
import random
import secrets
import string
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

from anyio import to_thread
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── Password ───────────────────────────────────────────────────────────────


async def hash_password(plain: str) -> str:
    return await to_thread.run_sync(_pwd_context.hash, plain)


async def verify_password(plain: str, hashed: str) -> bool:
    return await to_thread.run_sync(_pwd_context.verify, plain, hashed)


# ── JWT ────────────────────────────────────────────────────────────────────


def create_jwt(subject: str, extra_claims: dict[str, Any] | None = None) -> str:
    settings = get_settings()
    now = datetime.now(tz=UTC)
    expire = now + timedelta(minutes=settings.jwt_expire_minutes)
    payload: dict[str, Any] = {
        "sub": subject,
        "iat": now,
        "exp": expire,
        **(extra_claims or {}),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_refresh_jwt(subject: str, extra_claims: dict[str, Any] | None = None) -> str:
    settings = get_settings()
    now = datetime.now(tz=UTC)
    expire = now + timedelta(days=settings.jwt_refresh_expire_days)
    payload: dict[str, Any] = {
        "sub": subject,
        "iat": now,
        "exp": expire,
        "type": "refresh",
        **(extra_claims or {}),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_jwt(token: str) -> dict[str, Any]:
    """
    Decode and verify a JWT. Raises ValueError on invalid/expired tokens
    so callers can convert to a 401 response.
    """
    settings = get_settings()
    try:
        return jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
    except JWTError as exc:
        raise ValueError("Invalid or expired token") from exc


# ── Access Code Generation ─────────────────────────────────────────────────

_ALPHANUM = string.ascii_uppercase + string.digits


def _random_segment(length: int) -> str:
    return "".join(random.SystemRandom().choices(_alphanum_pool(), k=length))


_ALPHANUM_POOL = "".join(c for c in _ALPHANUM if c not in {"O", "0", "I", "1"})


def _alphanum_pool() -> str:
    return _ALPHANUM_POOL


def generate_access_code(type_: Literal["individual", "org"]) -> str:
    """
    Returns codes in the format:
      individual → IND-XXXX-XX
      org        → DA-XXXX-XX
    """
    pool = _alphanum_pool()
    rng = random.SystemRandom()
    segment4 = "".join(rng.choices(pool, k=4))
    segment2 = "".join(rng.choices(pool, k=2))
    prefix = "IND" if type_ == "individual" else "DA"
    return f"{prefix}-{segment4}-{segment2}"


# ── Temporary Password ─────────────────────────────────────────────────────


def generate_temp_password(length: int = 12) -> str:
    """Cryptographically secure alphanumeric temp password."""
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


# ── Device Fingerprint ─────────────────────────────────────────────────────


def fingerprint_device(user_agent: str, ip: str) -> str:
    """
    Deterministic SHA-256 fingerprint of user-agent + IP.
    Not a foolproof device lock, but a reasonable heuristic for the spec.
    """
    raw = f"{user_agent.strip()}|{ip.strip()}"
    return hashlib.sha256(raw.encode()).hexdigest()
