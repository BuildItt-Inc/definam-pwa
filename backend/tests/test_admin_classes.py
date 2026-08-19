"""Unit tests for Class Management endpoints in admin.py."""

from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

pytestmark = pytest.mark.anyio


@pytest.fixture
def anyio_backend():
    return "asyncio"


# Generate a fixed valid UUID for school
SCHOOL_ID = str(uuid.uuid4())


def _make_admin_token(org_id: str | None = SCHOOL_ID) -> str:
    import app.core.security as sec

    extra_claims = {"role": "admin"}
    if org_id:
        extra_claims["org_id"] = org_id
    return sec.create_jwt("admin-id", extra_claims)


@pytest.fixture(autouse=True)
def patch_jwt_settings(monkeypatch):
    import app.core.security as sec

    monkeypatch.setattr(
        sec,
        "get_settings",
        lambda: type(
            "S",
            (),
            {
                "jwt_secret": "supersecrettestkeyforciwhichisreallylongandsafe",
                "jwt_algorithm": "HS256",
                "jwt_expire_minutes": 60,
            },
        )(),
    )


def _auth_headers(org_id: str | None = SCHOOL_ID) -> dict:
    return {"Authorization": f"Bearer {_make_admin_token(org_id)}"}


# ── GET /admin/classes ─────────────────────────────────────────────────────


async def test_list_classes_returns_correct_shape():
    mock_class_row = MagicMock()
    mock_class_row.id = str(uuid.uuid4())
    mock_class_row.name = "SS2A"
    mock_class_row.student_count = 12
    mock_class_row.created_at = None

    with patch("app.api.v1.endpoints.admin.db_session") as mock_ctx:
        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.all.return_value = [mock_class_row]
        mock_session.execute = AsyncMock(return_value=mock_result)
        mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.get("/api/v1/admin/classes", headers=_auth_headers())

    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["name"] == "SS2A"
    assert data[0]["student_count"] == 12


# ── POST /admin/classes ────────────────────────────────────────────────────


async def test_create_class_success():
    with patch("app.api.v1.endpoints.admin.db_session") as mock_ctx:
        mock_session = AsyncMock()
        # Mock class uniqueness check returning None (no existing class)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute = AsyncMock(return_value=mock_result)
        mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.post(
                "/api/v1/admin/classes",
                json={"name": "SS1B"},
                headers=_auth_headers(),
            )

    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "SS1B"
    assert "created successfully" in data["message"]


async def test_create_class_duplicate_name_fails():
    with patch("app.api.v1.endpoints.admin.db_session") as mock_ctx:
        mock_session = AsyncMock()
        # Mock class uniqueness check returning a class (already exists)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = MagicMock()
        mock_session.execute = AsyncMock(return_value=mock_result)
        mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.post(
                "/api/v1/admin/classes",
                json={"name": "SS1B"},
                headers=_auth_headers(),
            )

    assert resp.status_code == 409
    assert "already exists" in resp.json()["detail"]


# ── POST /admin/classes/{class_id}/assign ──────────────────────────────────


async def test_assign_students_success():
    with patch("app.api.v1.endpoints.admin.db_session") as mock_ctx:
        mock_session = AsyncMock()
        # Mock class exists check returning a class
        mock_result_class = MagicMock()
        mock_result_class.scalar_one_or_none.return_value = MagicMock(name="SS2A")
        # Mock update result
        mock_result_update = MagicMock()
        mock_result_update.rowcount = 3

        mock_session.execute = AsyncMock(
            side_effect=[mock_result_class, mock_result_update]
        )
        mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.post(
                f"/api/v1/admin/classes/{str(uuid.uuid4())}/assign",
                json={"student_ids": ["s1", "s2", "s3"]},
                headers=_auth_headers(),
            )

    assert resp.status_code == 200
    data = resp.json()
    assert data["assigned_count"] == 3
    assert "Successfully assigned" in data["message"]


# ── POST /admin/classes/{class_id}/remove ──────────────────────────────────


async def test_remove_students_success():
    class_id = str(uuid.uuid4())
    with patch("app.api.v1.endpoints.admin.db_session") as mock_ctx:
        mock_session = AsyncMock()
        # Mock class exists check returning a class
        mock_result_class = MagicMock()
        mock_result_class.scalar_one_or_none.return_value = MagicMock(name="SS2A")
        # Mock update result
        mock_result_update = MagicMock()
        mock_result_update.rowcount = 2

        mock_session.execute = AsyncMock(
            side_effect=[mock_result_class, mock_result_update]
        )
        mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.post(
                f"/api/v1/admin/classes/{class_id}/remove",
                json={"student_ids": ["s1", "s2"]},
                headers=_auth_headers(),
            )

    assert resp.status_code == 200
    data = resp.json()
    assert data["removed_count"] == 2
    assert "Successfully removed" in data["message"]


# ── DELETE /admin/classes/{class_id} ───────────────────────────────────────


async def test_delete_class_success():
    class_id = str(uuid.uuid4())
    with patch("app.api.v1.endpoints.admin.db_session") as mock_ctx:
        mock_session = AsyncMock()
        # Mock class exists check
        mock_result_class = MagicMock()
        class_mock_obj = MagicMock()
        class_mock_obj.name = "SS2A"
        mock_result_class.scalar_one_or_none.return_value = class_mock_obj

        mock_session.execute = AsyncMock(return_value=mock_result_class)
        mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.delete(
                f"/api/v1/admin/classes/{class_id}",
                headers=_auth_headers(),
            )

    assert resp.status_code == 200
    data = resp.json()
    assert "deleted successfully" in data["message"]
