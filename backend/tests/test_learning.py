"""Unit tests for Part 1 of the subject-display fix: /subjects returns one
entry per unique subject name (deduplicated across SS1/SS2/SS3 rows), and
/subjects/by-name/{name}/chapters returns each level's chapters annotated
with class_level so the frontend can group them under section headers."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

pytestmark = pytest.mark.anyio


@pytest.fixture
def anyio_backend():
    return "asyncio"


def _make_token() -> str:
    import app.core.security as sec

    return sec.create_jwt("test-user-id", {"role": "student_individual"})


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
    return {"Authorization": f"Bearer {_make_token()}"}


# ── GET /subjects ─────────────────────────────────────────────────────────


def _subject_row(name: str, chapter_count: int, topic_count: int):
    row = MagicMock()
    row.name = name
    row.chapter_count = chapter_count
    row.topic_count = topic_count
    return row


async def test_get_subjects_groups_by_name_with_summed_counts():
    """Three class-level rows sharing a name (SS1/SS2/SS3 Mathematics) must
    already be collapsed into a single grouped row by the SQL GROUP BY —
    this test just confirms the endpoint returns that shape correctly, not
    duplicated per-row entries."""
    rows = [
        _subject_row("Mathematics", 12, 60),
        _subject_row("Chemistry", 8, 40),
    ]
    with patch("app.db.database.db_session") as mock_ctx:
        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.all.return_value = rows
        mock_session.execute = AsyncMock(return_value=mock_result)
        mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.get("/api/v1/subjects", headers=_auth_headers())

    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    assert {s["name"] for s in data} == {"Mathematics", "Chemistry"}

    math = next(s for s in data if s["name"] == "Mathematics")
    assert math["chapter_count"] == 12
    assert math["topic_count"] == 60
    # Grouped subjects have no single underlying row id or class_level —
    # those only make sense per class-level row, not for the merged entry.
    assert "id" not in math
    assert "class_level" not in math


# ── GET /subjects/by-name/{name}/chapters ───────────────────────────────────


def _chapter_row(
    chapter_id: str, subject_id: str, title: str, class_level: str, topic_count: int
):
    """Mimics a SQLAlchemy Row from `select(Chapter, Subject.class_level,
    func.count(...))`: index [0] is the Chapter object, class_level and
    topic_count are separate named attributes on the row itself."""
    chapter = SimpleNamespace(id=chapter_id, subject_id=subject_id, title=title)

    class FakeRow:
        def __getitem__(self, idx):
            if idx == 0:
                return chapter
            raise IndexError(idx)

    row = FakeRow()
    row.class_level = class_level
    row.topic_count = topic_count
    return row


async def test_get_chapters_by_name_annotates_class_level():
    """Chapters from every class-level row sharing the subject name must
    come back tagged with class_level, sorted SS1 before SS2, so the
    frontend can group them under section headers instead of flattening."""
    rows = [
        _chapter_row("ch-ss1-1", "subj-ss1", "Number & Numeration", "SS1", 5),
        _chapter_row("ch-ss2-1", "subj-ss2", "Trigonometry", "SS2", 4),
    ]
    with patch("app.db.database.db_session") as mock_ctx:
        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.all.return_value = rows
        mock_session.execute = AsyncMock(return_value=mock_result)
        mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.get(
                "/api/v1/subjects/by-name/Mathematics/chapters", headers=_auth_headers()
            )

    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    assert data[0]["class_level"] == "SS1"
    assert data[0]["title"] == "Number & Numeration"
    assert data[1]["class_level"] == "SS2"
    assert data[1]["title"] == "Trigonometry"


async def test_get_chapters_by_name_url_encodes_subject_name():
    """Subject names contain spaces (e.g. 'English Language') — the route
    must accept the URL-encoded form."""
    with patch("app.db.database.db_session") as mock_ctx:
        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.all.return_value = []
        mock_session.execute = AsyncMock(return_value=mock_result)
        mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.get(
                "/api/v1/subjects/by-name/English%20Language/chapters",
                headers=_auth_headers(),
            )

    assert resp.status_code == 200
    assert resp.json() == []
