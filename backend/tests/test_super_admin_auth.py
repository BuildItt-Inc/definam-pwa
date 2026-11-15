from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.deps import get_current_super_admin
from app.core.exceptions import (
    ForbiddenError,
    InvalidCredentialsError,
    InvalidTokenError,
)
from app.core.security import (
    create_refresh_jwt,
    create_super_admin_jwt,
    create_super_admin_refresh_jwt,
    decode_jwt,
)
from app.main import app
from app.schemas.auth import LoginRequest
from app.services import auth_service
from app.services.auth_service import clear_super_admin_lockout

pytestmark = pytest.mark.anyio


def test_create_super_admin_jwt_claims():
    uid = str(uuid.uuid4())
    token = create_super_admin_jwt(
        uid, extra_claims={"role": "super_admin", "session_id": "sess-1"}
    )
    claims = decode_jwt(token)
    assert claims["sub"] == uid
    assert claims["role"] == "super_admin"
    assert claims["scope"] == "super_admin"
    assert claims["session_id"] == "sess-1"

    # Lifetime should be <= 90 mins
    exp = datetime.fromtimestamp(claims["exp"], tz=UTC)
    iat = datetime.fromtimestamp(claims["iat"], tz=UTC)
    assert timedelta(minutes=89) <= (exp - iat) <= timedelta(minutes=91)


def test_create_super_admin_refresh_jwt_absolute_lifetime():
    uid = str(uuid.uuid4())
    # Initial token
    token = create_super_admin_refresh_jwt(uid, extra_claims={"role": "super_admin"})
    claims = decode_jwt(token)
    assert claims["scope"] == "super_admin"
    assert claims["type"] == "refresh"
    assert "orig_iat" in claims

    # Simulated rotation after 2 hours: orig_iat preserved
    orig_iat = claims["orig_iat"]
    rotated_token = create_super_admin_refresh_jwt(
        uid, extra_claims={"role": "super_admin"}, orig_iat=orig_iat
    )
    rotated_claims = decode_jwt(rotated_token)
    assert rotated_claims["orig_iat"] == orig_iat

    # Max expire must be 12 hours from orig_iat
    exp = datetime.fromtimestamp(rotated_claims["exp"], tz=UTC)
    orig_dt = datetime.fromtimestamp(orig_iat, tz=UTC)
    assert abs((exp - orig_dt) - timedelta(hours=12)) <= timedelta(seconds=2)


@pytest.mark.anyio
async def test_standard_login_rejects_super_admin():
    # If a super admin account tries to login through /auth/login, it must raise InvalidCredentialsError
    req = LoginRequest(username_or_email="superadmin_test", password="password123")
    with (
        patch(
            "app.services.auth_service.get_user_by_username", new_callable=AsyncMock
        ) as mock_user,
        patch("app.services.auth_service.verify_password", return_value=True),
    ):
        mock_user.return_value = {
            "id": str(uuid.uuid4()),
            "username": "superadmin_test",
            "role": "super_admin",
            "password_hash": "$2b$fakehash",
        }
        with pytest.raises(InvalidCredentialsError):
            await auth_service.login(req)


@pytest.mark.anyio
async def test_super_admin_login_rejects_non_super_admin():
    req = LoginRequest(username_or_email="student_test", password="password123")
    clear_super_admin_lockout("student_test")
    with (
        patch(
            "app.services.auth_service.get_user_by_username", new_callable=AsyncMock
        ) as mock_user,
        patch("app.services.auth_service.verify_password", return_value=True),
    ):
        mock_user.return_value = {
            "id": str(uuid.uuid4()),
            "username": "student_test",
            "role": "student_individual",
            "password_hash": "$2b$fakehash",
        }
        with pytest.raises(InvalidCredentialsError):
            await auth_service.super_admin_login(req)


@pytest.mark.anyio
async def test_standard_refresh_rejects_super_admin_token_and_role():
    # 1. Token with scope="super_admin"
    sa_token = create_super_admin_refresh_jwt(str(uuid.uuid4()))
    with pytest.raises(InvalidTokenError, match="Invalid token scope"):
        await auth_service.refresh(sa_token)

    # 2. Normal refresh token but user is super_admin in DB
    normal_refresh = create_refresh_jwt(
        str(uuid.uuid4()), extra_claims={"role": "super_admin"}
    )
    with patch(
        "app.services.auth_service.get_user_by_id", new_callable=AsyncMock
    ) as mock_get_user:
        mock_get_user.return_value = {
            "id": str(uuid.uuid4()),
            "role": "super_admin",
            "current_session_id": None,
        }
        with pytest.raises(
            InvalidTokenError, match="Super admin accounts must use super admin refresh"
        ):
            await auth_service.refresh(normal_refresh)


@pytest.mark.anyio
async def test_super_admin_refresh_rejects_normal_token():
    # A normal refresh token without scope="super_admin" must fail
    normal_refresh = create_refresh_jwt(str(uuid.uuid4()))
    with pytest.raises(InvalidTokenError, match="Invalid token scope"):
        await auth_service.super_admin_refresh(normal_refresh)


@pytest.mark.anyio
async def test_super_admin_refresh_enforces_12h_absolute_limit():
    uid = str(uuid.uuid4())
    # Token whose orig_iat was 13 hours ago
    past_ts = int((datetime.now(tz=UTC) - timedelta(hours=13)).timestamp())
    expired_ref = create_super_admin_refresh_jwt(uid, orig_iat=past_ts)
    with pytest.raises(
        InvalidTokenError,
        match="Invalid or expired refresh token|12-hour limit reached",
    ):
        await auth_service.super_admin_refresh(expired_ref)


@pytest.mark.anyio
async def test_super_admin_dep_requires_scope_and_db_role():

    uid = str(uuid.uuid4())
    sess = "sess-active"

    # 1. Token without scope="super_admin" fails
    with pytest.raises(ForbiddenError, match="Super admin scope required"):
        await get_current_super_admin({"sub": uid, "role": "super_admin"})

    # 2. Token with scope="super_admin" but user demoted to admin in DB fails
    with patch("app.api.deps.db_session") as mock_db:
        mock_session = AsyncMock()
        mock_user = AsyncMock()
        mock_user.role = "admin"  # demoted!
        mock_user.current_session_id = sess
        mock_session.get = AsyncMock(return_value=mock_user)
        mock_db.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_db.return_value.__aexit__ = AsyncMock(return_value=False)

        with pytest.raises(ForbiddenError, match="Super admin access only"):
            await get_current_super_admin(
                {
                    "sub": uid,
                    "role": "super_admin",
                    "scope": "super_admin",
                    "session_id": sess,
                }
            )

    # 3. Token with scope="super_admin" but session rotated in DB fails
    with patch("app.api.deps.db_session") as mock_db:
        mock_session = AsyncMock()
        mock_user = AsyncMock()
        mock_user.role = "super_admin"
        mock_user.current_session_id = "sess-rotated-new"  # rotated!
        mock_session.get = AsyncMock(return_value=mock_user)
        mock_db.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_db.return_value.__aexit__ = AsyncMock(return_value=False)

        with pytest.raises(InvalidTokenError, match="Session expired"):
            await get_current_super_admin(
                {
                    "sub": uid,
                    "role": "super_admin",
                    "scope": "super_admin",
                    "session_id": sess,
                }
            )


@pytest.mark.anyio
async def test_super_admin_login_endpoint_success():
    admin_id = str(uuid.uuid4())
    transport = ASGITransport(app=app)
    clear_super_admin_lockout("admin_ep_test")

    with (
        patch(
            "app.services.auth_service.get_user_by_username", new_callable=AsyncMock
        ) as mock_user,
        patch("app.services.auth_service.verify_password", return_value=True),
        patch(
            "app.services.auth_service.update_user_session_id", new_callable=AsyncMock
        ),
        patch("app.api.v1.endpoints.auth.db_session") as mock_db,
    ):
        mock_user.return_value = {
            "id": admin_id,
            "username": "admin_ep_test",
            "email": "admin@recallr.org",
            "role": "super_admin",
            "password_hash": "$2b$fakehash",
            "force_password_change": False,
        }
        mock_session = AsyncMock()
        # session.add() is synchronous in SQLAlchemy; override to avoid coroutine warnings
        mock_session.add = MagicMock()
        mock_db.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_db.return_value.__aexit__ = AsyncMock(return_value=False)

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.post(
                "/api/v1/auth/super-admin/login",
                json={
                    "username_or_email": "admin_ep_test",
                    "password": "correct_password",
                },
            )
            assert res.status_code == 200
            data = res.json()
            assert data["role"] == "super_admin"
            assert data["requires_2fa"] is False
            assert "access_token" in data

            # Verify token scope
            claims = decode_jwt(data["access_token"])
            assert claims["scope"] == "super_admin"

            # Verify cookie set
            assert "recall_super_admin_refresh_token" in res.cookies
