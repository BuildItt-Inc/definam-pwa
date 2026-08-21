from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select

from app.core.exceptions import (
    AuthenticationError,
    ForbiddenError,
    InvalidTokenError,
)
from app.core.security import decode_jwt
from app.db.database import db_session
from app.db.models import User

security = HTTPBearer()


def get_bearer_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """Extract and return the raw JWT from the Authorization: Bearer header."""
    if not credentials or not credentials.credentials:
        raise AuthenticationError("Invalid or missing authorization header.")
    return credentials.credentials


# ── Org student JWT dependency ─────────────────────────────────────────────


async def get_current_org_student(token: str = Depends(get_bearer_token)) -> dict:
    """
    Decode the bearer JWT and assert the role is student_org.
    Returns the full claims dict on success.
    """
    try:
        claims = decode_jwt(token)
    except ValueError as exc:
        raise InvalidTokenError() from exc

    if claims.get("role") != "student_org":
        raise ForbiddenError("Org student access only.")

    user_id = claims.get("sub")
    jwt_session_id = claims.get("session_id")
    if jwt_session_id:
        async with db_session() as session:
            db_session_id = (
                await session.execute(
                    select(User.current_session_id).where(User.id == user_id)
                )
            ).scalar_one_or_none()
            if db_session_id and db_session_id != jwt_session_id:
                raise InvalidTokenError("Session expired or logged in elsewhere.")

    return claims


# ── Any authenticated user (individual / org student / admin) ─────────────


async def get_current_user(token: str = Depends(get_bearer_token)) -> dict:
    """
    Decode the bearer JWT issued by this backend and return the claims.
    Works for all roles: student_individual, student_org, admin.

    The role is encoded in the JWT itself so no extra DB round-trip is
    needed for simple auth checks.  Endpoints that need fresh DB data
    should call get_user_by_id() directly.
    """
    try:
        claims = decode_jwt(token)
    except ValueError as exc:
        raise InvalidTokenError("Invalid or expired session.") from exc

    user_id = claims.get("sub")
    jwt_session_id = claims.get("session_id")
    if jwt_session_id:
        async with db_session() as session:
            db_session_id = (
                await session.execute(
                    select(User.current_session_id).where(User.id == user_id)
                )
            ).scalar_one_or_none()
            if db_session_id and db_session_id != jwt_session_id:
                raise InvalidTokenError("Session expired or logged in elsewhere.")

    return claims


# ── Admin-only dependency ─────────────────────────────────────────────────


def get_current_admin(claims: dict = Depends(get_current_user)) -> dict:
    """Assert that the authenticated user has the admin role."""
    if claims.get("role") != "admin":
        raise ForbiddenError("Admin access only.")
    return claims


# ── Typed aliases ──────────────────────────────────────────────────────────

OrgStudentDep = Annotated[dict, Depends(get_current_org_student)]
CurrentUserDep = Annotated[dict, Depends(get_current_user)]
AdminDep = Annotated[dict, Depends(get_current_admin)]
BearerTokenDep = Annotated[str, Depends(get_bearer_token)]
