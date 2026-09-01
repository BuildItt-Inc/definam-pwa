from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, patch

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


async def test_generate_curriculum_single_subject():
    with patch(
        "scripts.generate_curriculum_structure.seed_curriculum", new_callable=AsyncMock
    ) as mock_seed:
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.post(
                "/api/v1/admin/curriculum/generate/Mathematics",
                headers=_auth_headers(),
            )

    assert resp.status_code == 200
    mock_seed.assert_called_once_with(target_subject="Mathematics")
    assert "Mathematics" in resp.json()["message"]
