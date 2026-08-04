"""Unit tests for analytics endpoints: heatmap and admin stats."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


# ── Helpers ─────────────────────────────────────────────────────────────────


def _make_token(role: str = "student_individual", org_id: str | None = None) -> str:
    """Issue a real JWT signed with test settings so FastAPI's dep resolves it."""
    import app.core.security as sec

    extra: dict = {"role": role}
    if org_id:
        extra["org_id"] = org_id
    return sec.create_jwt("test-user-id", extra)


def _admin_token(org_id: str | None = None) -> str:
    return _make_token(role="admin", org_id=org_id)


def _student_token() -> str:
    return _make_token(role="student_individual")


@pytest.fixture(autouse=True)
def patch_jwt_settings(monkeypatch):
    """Use a fixed secret so JWTs created above are valid during tests."""
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


# ── GET /students/me/heatmap ─────────────────────────────────────────────────


@pytest.mark.anyio
async def test_heatmap_returns_90_days():
    """Heatmap must always return exactly 90 entries."""
    from datetime import UTC, datetime

    # Mock reviews, queue, and daily-activity items returned by execute().all()
    fake_reviews = [(datetime.now(UTC), "topic-1")]
    fake_queue = [(datetime.now(UTC), "topic-2")]
    fake_activity: list = []

    with patch(
        "app.api.v1.endpoints.students.db_session",
    ) as mock_ctx:
        mock_session = AsyncMock()
        mock_session.execute = AsyncMock(
            side_effect=[
                MagicMock(all=MagicMock(return_value=fake_reviews)),
                MagicMock(all=MagicMock(return_value=fake_queue)),
                MagicMock(all=MagicMock(return_value=fake_activity)),
            ]
        )
        mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.get(
                "/api/v1/students/me/heatmap",
                headers={"Authorization": f"Bearer {_student_token()}"},
            )

    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 90
    assert "date" in data[0]
    assert "count" in data[0]


@pytest.mark.anyio
async def test_heatmap_requires_auth():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.get("/api/v1/students/me/heatmap")
    assert resp.status_code in (401, 403, 422)


# ── GET /admin/stats ────────────────────────────────────────────────────────


@pytest.mark.anyio
async def test_admin_stats_returns_correct_shape():
    """Admin stats must return the four expected stat fields."""
    fake_stats = {
        "total_students": 42,
        "avg_accuracy": 78.5,
        "overdue_recall_count": 5,
        "active_subjects_count": 3,
    }

    with patch(
        "app.api.v1.endpoints.admin.db_session",
    ) as mock_ctx:
        mock_session = AsyncMock()

        # Simulate four scalar() calls in order: total, avg, overdue, subjects
        mock_session.execute = AsyncMock(
            side_effect=[
                MagicMock(scalar=MagicMock(return_value=fake_stats["total_students"])),
                MagicMock(scalar=MagicMock(return_value=fake_stats["avg_accuracy"])),
                MagicMock(
                    scalar=MagicMock(return_value=fake_stats["overdue_recall_count"])
                ),
                MagicMock(
                    scalar=MagicMock(return_value=fake_stats["active_subjects_count"])
                ),
            ]
        )
        mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.get(
                "/api/v1/admin/stats",
                headers={"Authorization": f"Bearer {_admin_token()}"},
            )

    assert resp.status_code == 200
    data = resp.json()
    assert "total_students" in data
    assert "avg_accuracy" in data
    assert "overdue_recall_count" in data
    assert "active_subjects_count" in data


@pytest.mark.anyio
async def test_admin_stats_rejects_non_admin():
    """Students must not be able to access admin stats."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.get(
            "/api/v1/admin/stats",
            headers={"Authorization": f"Bearer {_student_token()}"},
        )
    assert resp.status_code == 403


# ── POST /topics/:id/review — accuracy_score recording ────────────────────


@pytest.mark.anyio
async def test_step4_review_accepts_accuracy_score_field():
    """
    The review endpoint must accept an accuracy_score in the request body
    without erroring (validation check). Full DB write is tested via integration.
    When topic is not found (no real DB), we expect a 404 — not a 422 (schema error).
    This confirms the schema accepts the field correctly.
    """
    import uuid

    topic_id = str(uuid.uuid4())

    with patch("app.api.v1.endpoints.recall.db_session") as mock_ctx:
        mock_session = AsyncMock()
        # topic does NOT exist
        mock_session.execute = AsyncMock(
            return_value=MagicMock(scalar_one_or_none=MagicMock(return_value=None))
        )
        mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.post(
                f"/api/v1/topics/{topic_id}/review",
                json={"accuracy_score": 85.0},
                headers={"Authorization": f"Bearer {_student_token()}"},
            )

    # 404 means the schema was accepted (body parsed OK) but topic not found — correct
    assert resp.status_code == 404, (
        f"Expected 404 (topic not found), got {resp.status_code}. "
        "A 422 would indicate the accuracy_score field was rejected by schema."
    )


@pytest.mark.anyio
async def test_step4_review_accepts_empty_body():
    """accuracy_score is optional — empty body must not cause a 422."""
    import uuid

    topic_id = str(uuid.uuid4())

    with patch("app.api.v1.endpoints.recall.db_session") as mock_ctx:
        mock_session = AsyncMock()
        mock_session.execute = AsyncMock(
            return_value=MagicMock(scalar_one_or_none=MagicMock(return_value=None))
        )
        mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.post(
                f"/api/v1/topics/{topic_id}/review",
                json={},  # no accuracy_score
                headers={"Authorization": f"Bearer {_student_token()}"},
            )

    assert resp.status_code == 404  # body accepted, topic not found


@pytest.mark.anyio
async def test_step4_review_invalid_accuracy_score():
    """accuracy_score must be between 0.0 and 100.0. Invalid values should raise a 422."""
    import uuid

    topic_id = str(uuid.uuid4())

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # Value > 100.0
        resp1 = await client.post(
            f"/api/v1/topics/{topic_id}/review",
            json={"accuracy_score": 150.0},
            headers={"Authorization": f"Bearer {_student_token()}"},
        )
        assert resp1.status_code == 422

        # Value < 0.0
        resp2 = await client.post(
            f"/api/v1/topics/{topic_id}/review",
            json={"accuracy_score": -5.0},
            headers={"Authorization": f"Bearer {_student_token()}"},
        )
        assert resp2.status_code == 422
