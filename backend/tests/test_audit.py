from __future__ import annotations

import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.deps import get_current_super_admin, get_current_user
from app.core.config import Settings
from app.core.enums import AuditAction
from app.db.models import AuditLog
from app.main import app
from app.services.audit import write_audit_log

pytestmark = pytest.mark.anyio


def test_audit_action_enum_values():
    expected_actions = {
        "user.delete",
        "user.reset",
        "user.role_change",
        "code.generate",
        "code.revoke",
        "code.reactivate",
        "superadmin.invite",
        "superadmin.invite_revoke",
        "superadmin.invite_accept",
        "superadmin.remove",
        "topic.approve",
        "topic.publish",
        "feature.global_update",
        "feature.school_override",
        "auth.super_admin_login",
        "auth.super_admin_login_failed",
    }
    actual_actions = {a.value for a in AuditAction}
    assert expected_actions.issubset(actual_actions)


def test_production_disables_docs():
    prod_settings = Settings(environment="production")
    assert prod_settings.is_production is True

    dev_settings = Settings(environment="development")
    assert dev_settings.is_production is False


@pytest.mark.anyio
async def test_audit_log_endpoint_requires_super_admin():
    app.dependency_overrides[get_current_user] = lambda: {
        "sub": str(uuid.uuid4()),
        "role": "student_individual",
    }
    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.get(
                "/api/v1/super-admin/audit-logs",
                headers={"Authorization": "Bearer fake-token"},
            )
            assert res.status_code == 403
    finally:
        app.dependency_overrides.clear()


@pytest.mark.anyio
async def test_role_change_restrictions():
    admin_id = str(uuid.uuid4())
    app.dependency_overrides[get_current_super_admin] = lambda: {
        "sub": admin_id,
        "role": "super_admin",
    }
    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # 1. Disallow setting role to super_admin
            other_user_id = str(uuid.uuid4())
            res = await client.patch(
                f"/api/v1/super-admin/users/{other_user_id}/role",
                json={"role": "super_admin"},
                headers={"Authorization": "Bearer fake-token"},
            )
            assert res.status_code == 400
            assert "Cannot grant super_admin role" in res.json()["detail"]

            # 2. Disallow changing own role
            res = await client.patch(
                f"/api/v1/super-admin/users/{admin_id}/role",
                json={"role": "admin"},
                headers={"Authorization": "Bearer fake-token"},
            )
            assert res.status_code == 400
            assert "Cannot change your own role" in res.json()["detail"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.anyio
async def test_internal_topics_endpoints_require_super_admin():
    # Student role cannot approve/publish
    app.dependency_overrides[get_current_user] = lambda: {
        "sub": str(uuid.uuid4()),
        "role": "student_individual",
    }
    transport = ASGITransport(app=app)
    topic_id = str(uuid.uuid4())
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res_approve = await client.patch(
                f"/api/v1/internal/topics/{topic_id}/approve",
                headers={"Authorization": "Bearer fake-token"},
            )
            assert res_approve.status_code == 403

            res_publish = await client.patch(
                f"/api/v1/internal/topics/{topic_id}/publish",
                headers={"Authorization": "Bearer fake-token"},
            )
            assert res_publish.status_code == 403
    finally:
        app.dependency_overrides.clear()


@pytest.mark.anyio
async def test_write_audit_log_helper():
    mock_session = MagicMock()
    entry = await write_audit_log(
        mock_session,
        actor_user_id="user-123",
        actor_username="admin_user",
        action=AuditAction.USER_DELETE,
        target_type="user",
        target_id="target-456",
        details={"reason": "test"},
        ip="127.0.0.1",
    )
    assert entry.actor_user_id == "user-123"
    assert entry.actor_username == "admin_user"
    assert entry.action == "user.delete"
    assert entry.target_type == "user"
    assert entry.target_id == "target-456"
    assert entry.details == {"reason": "test"}
    assert entry.ip == "127.0.0.1"
    mock_session.add.assert_called_once_with(entry)


@pytest.mark.anyio
async def test_list_audit_logs_authorized():
    admin_id = str(uuid.uuid4())
    app.dependency_overrides[get_current_super_admin] = lambda: {
        "sub": admin_id,
        "role": "super_admin",
    }
    transport = ASGITransport(app=app)
    try:
        with patch("app.api.v1.endpoints.super_admin.db_session") as mock_db:
            mock_session = AsyncMock()
            mock_count_res = MagicMock()
            mock_count_res.scalar_one.return_value = 1

            mock_entry = AuditLog(
                id=str(uuid.uuid4()),
                actor_user_id=admin_id,
                actor_username="admin_test",
                action="user.delete",
                target_type="user",
                target_id="user-xyz",
                details={"role": "student_individual"},
                ip="127.0.0.1",
                created_at=datetime.now(tz=UTC),
            )
            mock_scalars = MagicMock()
            mock_scalars.all.return_value = [mock_entry]
            mock_logs_res = MagicMock()
            mock_logs_res.scalars.return_value = mock_scalars

            mock_session.execute = AsyncMock(
                side_effect=[mock_count_res, mock_logs_res]
            )
            mock_db.return_value.__aenter__ = AsyncMock(return_value=mock_session)
            mock_db.return_value.__aexit__ = AsyncMock(return_value=False)

            async with AsyncClient(
                transport=transport, base_url="http://test"
            ) as client:
                res = await client.get(
                    "/api/v1/super-admin/audit-logs?page=1&page_size=10",
                    headers={"Authorization": "Bearer fake-token"},
                )
                assert res.status_code == 200
                data = res.json()
                assert data["total"] == 1
                assert len(data["items"]) == 1
                assert data["items"][0]["action"] == "user.delete"
                assert data["items"][0]["actor_username"] == "admin_test"
    finally:
        app.dependency_overrides.clear()
