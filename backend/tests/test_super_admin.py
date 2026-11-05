from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.deps import get_current_super_admin, get_current_user
from app.main import app

pytestmark = pytest.mark.anyio


@pytest.mark.anyio
async def test_super_admin_endpoints_require_super_admin():
    # Override get_current_user to return a student role
    app.dependency_overrides[get_current_user] = lambda: {
        "sub": "00000000-0000-0000-0000-000000000002",
        "role": "student_individual",
    }
    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.get(
                "/api/v1/super-admin/overview",
                headers={"Authorization": "Bearer fake-token"},
            )
            assert res.status_code == 403
    finally:
        app.dependency_overrides.clear()


@pytest.mark.anyio
async def test_heartbeat_endpoint():
    app.dependency_overrides[get_current_user] = lambda: {
        "sub": "00000000-0000-0000-0000-000000000002",
        "role": "student_individual",
    }
    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch(
                "app.api.v1.endpoints.auth.update_user_last_seen",
                new_callable=AsyncMock,
            ):
                res = await client.post(
                    "/api/v1/auth/heartbeat",
                    headers={"Authorization": "Bearer fake-token"},
                )
                assert res.status_code == 200
                assert "last_seen_at" in res.json()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.anyio
async def test_super_admin_overview_authorized():
    app.dependency_overrides[get_current_super_admin] = lambda: {
        "sub": "00000000-0000-0000-0000-000000000001",
        "role": "super_admin",
    }
    transport = ASGITransport(app=app)
    try:
        with patch("app.api.v1.endpoints.super_admin.db_session") as mock_db:
            mock_session = AsyncMock()
            mock_result = MagicMock()
            mock_result.scalar_one.return_value = 5
            mock_result.all.return_value = [("super_admin", 1)]
            mock_session.execute = AsyncMock(return_value=mock_result)
            mock_db.return_value.__aenter__ = AsyncMock(return_value=mock_session)
            mock_db.return_value.__aexit__ = AsyncMock(return_value=False)

            async with AsyncClient(
                transport=transport, base_url="http://test"
            ) as client:
                res = await client.get(
                    "/api/v1/super-admin/overview",
                    headers={"Authorization": "Bearer fake-token"},
                )
                assert res.status_code == 200
                data = res.json()
                assert "online_users" in data
                assert "total_users" in data
    finally:
        app.dependency_overrides.clear()
