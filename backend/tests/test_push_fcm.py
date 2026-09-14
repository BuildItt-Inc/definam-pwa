from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.fcm import register_token, send_multicast_fcm, unregister_token
from app.services.push import send_daily_recall_push, send_streak_warning_push
from app.worker import WorkerSettings


@pytest.mark.asyncio
async def test_register_and_unregister_token():
    mock_session = AsyncMock()

    class MockContextManager:
        async def __aenter__(self):
            return mock_session

        async def __aexit__(self, exc_type, exc, tb):
            return None

    with patch("app.services.fcm.db_session", return_value=MockContextManager()):
        # Test register
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        await register_token(user_id="user-123", fcm_token="token-abc", device_type="web")
        assert mock_session.commit.called

        # Test unregister
        mock_session.reset_mock()
        await unregister_token(fcm_token="token-abc")
        assert mock_session.commit.called


@pytest.mark.asyncio
async def test_send_multicast_fcm_no_tokens():
    mock_session = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_session.execute.return_value = mock_result

    class MockContextManager:
        async def __aenter__(self):
            return mock_session

        async def __aexit__(self, exc_type, exc, tb):
            return None

    with patch("app.services.fcm.db_session", return_value=MockContextManager()):
        res = await send_multicast_fcm(
            user_ids=["non-existent-user"],
            title="Test Title",
            body="Test Body",
        )
        assert res["status"] == "skipped"
        assert res["reason"] == "no registered devices"


@pytest.mark.asyncio
async def test_onesignal_recall_and_streak_push_payloads():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.raise_for_status.return_value = None
    mock_response.json.return_value = {"id": "onesignal-123", "recipients": 1}

    mock_client = AsyncMock()
    mock_client.post.return_value = mock_response

    # Test recall push helper
    res_recall = await send_daily_recall_push(
        user_id="user-1",
        topic_titles=["Maths", "Physics"],
        client=mock_client,
    )
    assert res_recall == {"id": "onesignal-123", "recipients": 1}
    assert mock_client.post.called

    call_args = mock_client.post.call_args
    assert call_args[0][0] == "https://onesignal.com/api/v1/notifications"
    json_data = call_args[1]["json"]
    assert json_data["include_external_user_ids"] == ["user-1"]
    assert json_data["data"]["type"] == "recall"

    # Test streak warning push helper
    mock_client.reset_mock()
    res_streak = await send_streak_warning_push(
        user_id="user-2",
        streak_count=5,
        display_name="Alex",
        client=mock_client,
    )
    assert res_streak == {"id": "onesignal-123", "recipients": 1}
    assert mock_client.post.called

    call_args_streak = mock_client.post.call_args
    assert call_args_streak[0][0] == "https://onesignal.com/api/v1/notifications"
    json_data_streak = call_args_streak[1]["json"]
    assert json_data_streak["include_external_user_ids"] == ["user-2"]
    assert json_data_streak["data"]["type"] == "streak"
    assert json_data_streak["data"]["streak"] == "5"


def test_arq_worker_settings_configuration():
    assert len(WorkerSettings.functions) == 2
    assert len(WorkerSettings.cron_jobs) == 2
