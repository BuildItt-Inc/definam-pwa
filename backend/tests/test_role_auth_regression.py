from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.security import create_refresh_jwt, decode_jwt
from app.main import app

pytestmark = pytest.mark.anyio


@pytest.mark.anyio
async def test_student_individual_login_token_contents_and_refresh_unchanged():
    user_id = str(uuid.uuid4())
    transport = ASGITransport(app=app)

    with (
        patch(
            "app.services.auth_service.get_user_by_username", new_callable=AsyncMock
        ) as mock_user,
        patch("app.services.auth_service.verify_password", return_value=True),
        patch(
            "app.services.auth_service.update_user_session_id", new_callable=AsyncMock
        ),
    ):
        mock_user.return_value = {
            "id": user_id,
            "username": "student_reg_test",
            "role": "student_individual",
            "password_hash": "$2b$fakehash",
            "force_password_change": False,
        }

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.post(
                "/api/v1/auth/login",
                json={
                    "username_or_email": "student_reg_test",
                    "password": "valid_password",
                },
            )
            assert res.status_code == 200
            data = res.json()
            assert data["role"] == "student_individual"
            assert "access_token" in data
            assert "refresh_token" in res.cookies

            # Verify claims: must contain sub, role, session_id, and NO scope
            claims = decode_jwt(data["access_token"])
            assert claims["sub"] == user_id
            assert claims["role"] == "student_individual"
            assert "session_id" in claims
            assert "scope" not in claims


@pytest.mark.anyio
async def test_school_admin_login_token_contents_and_scope_omitted():
    admin_id = str(uuid.uuid4())
    org_id = str(uuid.uuid4())
    transport = ASGITransport(app=app)

    with (
        patch(
            "app.services.auth_service.get_user_by_username", new_callable=AsyncMock
        ) as mock_user,
        patch("app.services.auth_service.verify_password", return_value=True),
        patch(
            "app.services.auth_service.update_user_session_id", new_callable=AsyncMock
        ),
    ):
        mock_user.return_value = {
            "id": admin_id,
            "username": "school_admin_reg_test",
            "role": "admin",
            "org_id": org_id,
            "password_hash": "$2b$fakehash",
            "force_password_change": False,
        }

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.post(
                "/api/v1/auth/login",
                json={
                    "username_or_email": "school_admin_reg_test",
                    "password": "valid_password",
                },
            )
            assert res.status_code == 200
            data = res.json()
            assert data["role"] == "admin"
            assert "access_token" in data

            claims = decode_jwt(data["access_token"])
            assert claims["sub"] == admin_id
            assert claims["role"] == "admin"
            assert claims["org_id"] == org_id
            assert "scope" not in claims


@pytest.mark.anyio
async def test_org_student_login_token_contents_and_scope_omitted():
    student_id = str(uuid.uuid4())
    org_id = str(uuid.uuid4())
    transport = ASGITransport(app=app)

    with (
        patch(
            "app.services.auth_service.get_access_code", new_callable=AsyncMock
        ) as mock_code,
        patch(
            "app.services.auth_service.get_user_by_id", new_callable=AsyncMock
        ) as mock_user,
        patch(
            "app.services.auth_service.revoke_and_reactivate_code",
            new_callable=AsyncMock,
        ),
        patch(
            "app.services.auth_service.update_user_session_id",
            new_callable=AsyncMock,
        ),
    ):
        mock_code.return_value = {
            "id": str(uuid.uuid4()),
            "code": "DA-TEST-01",
            "type": "org",
            "status": "active",
            "school_id": org_id,
            "activated_by": student_id,
            "device_fingerprint": None,
        }
        mock_user.return_value = {
            "id": student_id,
            "username": "org_student_01",
            "role": "student_org",
            "org_id": org_id,
        }

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.post(
                "/api/v1/auth/org-login",
                json={"access_code": "DA-TEST-01"},
            )
            assert res.status_code == 200
            data = res.json()
            assert data["role"] == "student_org"
            assert "access_token" in data

            claims = decode_jwt(data["access_token"])
            assert claims["sub"] == student_id
            assert claims["role"] == "student_org"
            assert claims["org_id"] == org_id
            assert "scope" not in claims


@pytest.mark.anyio
async def test_standard_refresh_for_student_and_admin_unchanged():
    uid = str(uuid.uuid4())
    org_id = str(uuid.uuid4())
    refresh_token = create_refresh_jwt(
        uid, extra_claims={"role": "admin", "session_id": "sess-active"}
    )
    transport = ASGITransport(app=app)

    with patch(
        "app.services.auth_service.get_user_by_id", new_callable=AsyncMock
    ) as mock_user:
        mock_user.return_value = {
            "id": uid,
            "role": "admin",
            "org_id": org_id,
            "current_session_id": "sess-active",
        }

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.post(
                "/api/v1/auth/refresh",
                cookies={"refresh_token": refresh_token},
            )
            assert res.status_code == 200
            data = res.json()
            assert data["role"] == "admin"
            assert "access_token" in data

            # Verify refreshed token claims
            claims = decode_jwt(data["access_token"])
            assert claims["sub"] == uid
            assert claims["role"] == "admin"
            assert claims["org_id"] == org_id
            assert "scope" not in claims
