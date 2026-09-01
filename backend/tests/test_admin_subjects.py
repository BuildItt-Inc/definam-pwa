from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

pytestmark = pytest.mark.anyio

SCHOOL_ID = str(uuid.uuid4())


def _make_admin_token() -> str:
    import app.core.security as sec

    return sec.create_jwt("admin-id", {"role": "admin", "org_id": SCHOOL_ID})


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


def _auth_headers() -> dict:
    return {"Authorization": f"Bearer {_make_admin_token()}"}


async def test_list_all_subjects():
    sub1 = MagicMock()
    sub1.id = "s1"
    sub1.name = "English Language"
    sub1.class_level = "SS1"
    sub1.created_at = None
    sub1.updated_at = None

    sub2 = MagicMock()
    sub2.id = "s2"
    sub2.name = "English Language"
    sub2.class_level = "SS2"
    sub2.created_at = None
    sub2.updated_at = None

    with patch("app.api.v1.endpoints.admin.db_session") as mock_ctx:
        mock_session = AsyncMock()
        mock_res_subjects = MagicMock()
        mock_res_subjects.scalars.return_value.all.return_value = [sub1, sub2]

        mock_res_count = MagicMock()
        mock_res_count.scalar.return_value = 5

        mock_session.execute = AsyncMock(
            side_effect=[
                mock_res_subjects,
                mock_res_count,
                mock_res_count,
                mock_res_count,
            ]
        )
        mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.get("/api/v1/admin/subjects", headers=_auth_headers())

    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["name"] == "English Language"
    assert data[0]["class_levels"] == ["SS1", "SS2"]
    assert data[0]["chapter_count"] == 5
