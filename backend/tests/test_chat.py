"""Unit tests for the AI chat endpoints: history clearing and
disconnect-safe persistence of streamed responses."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import anyio
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

pytestmark = pytest.mark.anyio


@pytest.fixture
def anyio_backend():
    return "asyncio"


def _make_token(role: str = "student_individual") -> str:
    import app.core.security as sec

    return sec.create_jwt("test-user-id", {"role": role})


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


# ── DELETE /chat/history ─────────────────────────────────────────────────────


async def test_clear_chat_history_requires_auth():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        resp = await client.delete("/api/v1/chat/history")
    assert resp.status_code in (401, 403, 422)


async def test_clear_chat_history_deletes_and_returns_ok():
    with patch("app.api.v1.endpoints.chat.db_session") as mock_ctx:
        mock_session = AsyncMock()
        mock_session.execute = AsyncMock()
        mock_session.commit = AsyncMock()
        mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.delete(
                "/api/v1/chat/history?topic_id=topic-1",
                headers={"Authorization": f"Bearer {_make_token()}"},
            )

    assert resp.status_code == 200
    assert resp.json() == {"ok": True}
    mock_session.execute.assert_awaited_once()
    mock_session.commit.assert_awaited_once()


# ── /chat/stream persistence on disconnect ──────────────────────────────────


async def _fake_stream_groq_response(question, context, history):
    """Stands in for Groq: yields chunks slowly enough that a cancellation
    injected mid-way lands between chunks, same as a real client disconnect
    arriving while the model is still generating."""
    for i in range(6):
        await anyio.sleep(0.03)
        yield ("chunk", f"part{i} ")
    yield ("usage", {"input_tokens": 5, "output_tokens": 5})


async def test_stream_saves_partial_response_when_client_disconnects_midway():
    """Regression test: Starlette cancels the response generator when the
    client disconnects (e.g. a page refresh) mid-stream. Before the fix, the
    assistant's partial reply was silently dropped — the student's question
    stayed saved with no answer ever persisted. The generator must persist
    whatever was generated so far even when cancelled."""
    from app.api.v1.endpoints.chat import chat_stream

    fake_redis = MagicMock()
    fake_redis.get = MagicMock(return_value=None)
    fake_redis.setex = MagicMock()
    fake_redis.incr = MagicMock()
    fake_redis.expire = MagicMock()

    mock_session = AsyncMock()
    mock_execute_result = MagicMock()
    mock_execute_result.scalars.return_value.all.return_value = []
    mock_session.execute = AsyncMock(return_value=mock_execute_result)
    mock_session.add = MagicMock()
    mock_session.commit = AsyncMock()

    with (
        patch("app.api.v1.endpoints.chat.get_redis", return_value=fake_redis),
        patch("app.api.v1.endpoints.chat.get_daily_usage", AsyncMock(return_value=0)),
        patch("app.api.v1.endpoints.chat.increment_daily_usage", AsyncMock()),
        patch(
            "app.api.v1.endpoints.chat.stream_groq_response", _fake_stream_groq_response
        ),
        patch("app.api.v1.endpoints.chat.db_session") as mock_ctx,
    ):
        mock_ctx.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)

        response = await chat_stream(
            question="what about 4 x 4",
            claims={"sub": "test-user-id"},
            topic_id=None,
        )

        collected: list[str] = []
        cancelled = False

        async def drive():
            nonlocal cancelled
            try:
                async for chunk in response.body_iterator:
                    collected.append(chunk)
            except BaseException:
                cancelled = True
                raise

        async def canceller(scope: anyio.CancelScope):
            await anyio.sleep(0.1)  # let ~3 chunks through, then simulate disconnect
            scope.cancel()

        async with anyio.create_task_group() as tg:
            tg.start_soon(canceller, tg.cancel_scope)
            tg.start_soon(drive)

    assert cancelled, "the stream should have been cancelled mid-way"
    assert 0 < len(collected) < 6, "should have received some but not all chunks"

    # The user question (add #1) and the partial assistant reply (add #2)
    # must both have been persisted despite the cancellation.
    assert mock_session.add.call_count == 2
    assistant_msg = mock_session.add.call_args_list[-1].args[0]
    assert assistant_msg.role == "assistant"
    assert assistant_msg.content.startswith("part0 ")
    assert len(assistant_msg.content) < len("part0 part1 part2 part3 part4 part5 ")
    assert mock_session.commit.await_count == 2
