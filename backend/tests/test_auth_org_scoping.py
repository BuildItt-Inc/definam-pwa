"""Regression tests for the admin org-scoping JWT bug.

login() and refresh() must put org_id in the JWT (when the user has one),
so admin.py's org-scoped BOLA checks (already correctly written) actually
activate instead of silently no-op'ing. Root cause: login() never included
org_id at all; refresh() trusted the (possibly stale/missing) claim from
the old token instead of re-fetching from the DB.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture(autouse=True)
def patch_jwt_settings(monkeypatch):
    """Use a fixed secret so tokens created here can be decoded again."""
    import app.core.security as sec

    fake_settings = type(
        "S",
        (),
        {
            "jwt_secret": "supersecrettestkeyforciwhichisreallylongandsafe",
            "jwt_algorithm": "HS256",
            "jwt_expire_minutes": 60,
            "jwt_refresh_expire_days": 30,
        },
    )()
    monkeypatch.setattr(sec, "get_settings", lambda: fake_settings)


def _decode(token: str) -> dict:
    import app.core.security as sec

    return sec.decode_jwt(token)


# ── login() ──────────────────────────────────────────────────────────────


@pytest.mark.anyio
async def test_login_includes_org_id_for_org_scoped_admin():
    user_row = {
        "id": "admin-id",
        "role": "admin",
        "org_id": "school-uuid-123",
        "force_password_change": False,
        "username": "admin@school.ng",
        "password_hash": "hashed",
    }

    with (
        patch(
            "app.services.auth_service.get_user_by_username",
            new_callable=AsyncMock,
            return_value=user_row,
        ),
        patch("app.services.auth_service.verify_password", return_value=True),
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.post(
                "/api/v1/auth/login",
                json={"username_or_email": "admin@school.ng", "password": "x"},
            )

    assert resp.status_code == 200
    claims = _decode(resp.json()["access_token"])
    assert claims.get("org_id") == "school-uuid-123"


@pytest.mark.anyio
async def test_login_omits_org_id_for_individual_student():
    user_row = {
        "id": "student-id",
        "role": "student_individual",
        "org_id": None,
        "force_password_change": False,
        "username": "student1",
        "password_hash": "hashed",
    }

    with (
        patch(
            "app.services.auth_service.get_user_by_username",
            new_callable=AsyncMock,
            return_value=user_row,
        ),
        patch("app.services.auth_service.verify_password", return_value=True),
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.post(
                "/api/v1/auth/login",
                json={"username_or_email": "student1", "password": "x"},
            )

    assert resp.status_code == 200
    claims = _decode(resp.json()["access_token"])
    assert "org_id" not in claims


# ── refresh() ────────────────────────────────────────────────────────────


@pytest.mark.anyio
async def test_refresh_uses_fresh_org_id_from_db_not_stale_token_claim():
    """If an admin's org_id changed since the token was issued (or the old
    token predates this fix and has none), refresh must reflect the DB's
    current value -- not whatever the old token happened to carry."""
    import app.core.security as sec

    old_refresh_token = sec.create_refresh_jwt(
        subject="admin-id",
        extra_claims={"role": "admin", "org_id": "OLD-STALE-ORG"},
    )

    fresh_user_row = {
        "id": "admin-id",
        "role": "admin",
        "org_id": "NEW-CURRENT-ORG",
        "force_password_change": False,
        "name": None,
        "email": None,
    }

    with patch(
        "app.services.auth_service.get_user_by_id",
        new_callable=AsyncMock,
        return_value=fresh_user_row,
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            client.cookies.set("refresh_token", old_refresh_token)
            resp = await client.post("/api/v1/auth/refresh")

    assert resp.status_code == 200
    claims = _decode(resp.json()["access_token"])
    assert claims.get("org_id") == "NEW-CURRENT-ORG"


# ── admin.py: the filter actually activates once org_id is present ────────


@pytest.mark.anyio
async def test_admin_stats_applies_org_filter_when_org_id_present():
    """With an org-scoped admin token, the stats queries must include an
    org_id/school filter -- confirming the pre-existing `if org_id:` branches
    in admin.py actually engage now that the claim exists."""
    import app.core.security as sec

    admin_token = sec.create_jwt(
        subject="admin-id", extra_claims={"role": "admin", "org_id": "school-xyz"}
    )

    captured_queries = []

    async def fake_execute(query):
        captured_queries.append(str(query))
        return MagicMock(scalar=MagicMock(return_value=0))

    with patch("app.api.v1.endpoints.admin.db_session") as mock_ctx:
        mock_session = AsyncMock()
        mock_session.execute = AsyncMock(side_effect=fake_execute)
        mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.get(
                "/api/v1/admin/stats",
                headers={"Authorization": f"Bearer {admin_token}"},
            )

    assert resp.status_code == 200
    # Every query admin/stats issues should carry the org scoping filter.
    assert captured_queries, "no queries were executed"
    assert all("org_id" in q for q in captured_queries), captured_queries
