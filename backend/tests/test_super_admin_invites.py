from __future__ import annotations

import asyncio
import hashlib
import secrets
import socket
import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.api.deps import get_current_super_admin
from app.core.enums import AuditAction, InviteStatus
from app.core.security import create_super_admin_jwt
from app.db.database import db_session
from app.db.models import AuditLog, SuperAdminInvite, User
from app.main import app
from scripts.seed_super_admin import seed as seed_super_admin

pytestmark = pytest.mark.anyio


def _is_postgres_reachable() -> bool:
    try:
        with socket.create_connection(("localhost", 5432), timeout=0.5):
            return True
    except OSError:
        return False


requires_postgres = pytest.mark.skipif(
    not _is_postgres_reachable(),
    reason="Live PostgreSQL database not available at localhost:5432",
)


@pytest.mark.anyio
@requires_postgres
async def test_invite_super_admin_success():
    actor_id = str(uuid.uuid4())
    async with db_session() as session:
        actor = User(
            id=actor_id,
            username=f"chief_admin_{uuid.uuid4().hex[:6]}",
            role="super_admin",
        )
        session.add(actor)
        await session.commit()

    app.dependency_overrides[get_current_super_admin] = lambda: {
        "sub": actor_id,
        "username": "chief_admin",
        "role": "super_admin",
        "scope": "super_admin",
    }
    transport = ASGITransport(app=app)
    try:
        with patch(
            "app.api.v1.endpoints.super_admin_invites.send_super_admin_invite",
            new_callable=AsyncMock,
        ) as mock_send:
            async with AsyncClient(
                transport=transport, base_url="http://test"
            ) as client:
                res = await client.post(
                    "/api/v1/super-admin/admins/invite",
                    json={"email": f"newadmin_{uuid.uuid4().hex[:6]}@example.com"},
                )
                assert res.status_code == 201
                data = res.json()
                assert "email" in data
                assert data["status"] == "pending"
                invite_id = data["id"]

                # Verify email dispatch was called with token
                mock_send.assert_awaited_once()
                args, _ = mock_send.await_args
                assert len(args[1]) >= 40  # raw token urlsafe 32 bytes

            # Verify invite stored in DB with token_hash (not raw token)
            async with db_session() as session:
                invite = await session.get(SuperAdminInvite, invite_id)
                assert invite is not None
                assert invite.status == InviteStatus.PENDING
                assert invite.token_hash != args[1]
                assert hashlib.sha256(args[1].encode()).hexdigest() == invite.token_hash

                # Check audit log written
                audit_res = await session.execute(
                    select(AuditLog).where(
                        AuditLog.action == AuditAction.SUPERADMIN_INVITE,
                        AuditLog.target_id == invite_id,
                    )
                )
                audit_entry = audit_res.scalar_one_or_none()
                assert audit_entry is not None
                assert audit_entry.actor_user_id == actor_id
    finally:
        app.dependency_overrides.clear()


@pytest.mark.anyio
@requires_postgres
async def test_invite_super_admin_duplicate_pending_rejected():
    actor_id = str(uuid.uuid4())
    async with db_session() as session:
        actor = User(
            id=actor_id,
            username=f"chief_admin_{uuid.uuid4().hex[:6]}",
            role="super_admin",
        )
        session.add(actor)
        await session.commit()

    app.dependency_overrides[get_current_super_admin] = lambda: {
        "sub": actor_id,
        "username": "chief_admin",
        "role": "super_admin",
        "scope": "super_admin",
    }
    transport = ASGITransport(app=app)
    dup_email = f"dup_{uuid.uuid4().hex[:6]}@example.com"
    try:
        with patch(
            "app.api.v1.endpoints.super_admin_invites.send_super_admin_invite",
            new_callable=AsyncMock,
        ):
            async with AsyncClient(
                transport=transport, base_url="http://test"
            ) as client:
                res1 = await client.post(
                    "/api/v1/super-admin/admins/invite",
                    json={"email": dup_email},
                )
                assert res1.status_code == 201

                # Second invite while first is still pending must fail
                res2 = await client.post(
                    "/api/v1/super-admin/admins/invite",
                    json={"email": dup_email},
                )
                assert res2.status_code == 400
                assert "pending invite" in res2.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.anyio
@requires_postgres
async def test_list_super_admin_invites():
    app.dependency_overrides[get_current_super_admin] = lambda: {
        "sub": str(uuid.uuid4()),
        "role": "super_admin",
        "scope": "super_admin",
    }
    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.get("/api/v1/super-admin/admins/invites")
            assert res.status_code == 200
            data = res.json()
            assert "items" in data
            assert "total" in data
            assert isinstance(data["items"], list)
    finally:
        app.dependency_overrides.clear()


@pytest.mark.anyio
@requires_postgres
async def test_revoke_super_admin_invite():
    actor_id = str(uuid.uuid4())
    invite_id = str(uuid.uuid4())
    async with db_session() as session:
        actor = User(
            id=actor_id,
            username=f"chief_admin_{uuid.uuid4().hex[:6]}",
            role="super_admin",
        )
        session.add(actor)
        invite = SuperAdminInvite(
            id=invite_id,
            email=f"to_revoke_{uuid.uuid4().hex[:6]}@example.com",
            token_hash=f"hash_to_revoke_{uuid.uuid4().hex}",
            status=InviteStatus.PENDING,
            expires_at=datetime.now(tz=UTC) + timedelta(days=2),
        )
        session.add(invite)
        await session.commit()

    app.dependency_overrides[get_current_super_admin] = lambda: {
        "sub": actor_id,
        "username": "chief_admin",
        "role": "super_admin",
        "scope": "super_admin",
    }

    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.post(
                f"/api/v1/super-admin/admins/invite/{invite_id}/revoke"
            )
            assert res.status_code == 200
            assert res.json()["status"] == InviteStatus.REVOKED

            # Check audit log written
            async with db_session() as session:
                inv = await session.get(SuperAdminInvite, invite_id)
                assert inv.status == InviteStatus.REVOKED
                audit_res = await session.execute(
                    select(AuditLog).where(
                        AuditLog.action == AuditAction.SUPERADMIN_INVITE_REVOKE,
                        AuditLog.target_id == invite_id,
                    )
                )
                assert audit_res.scalar_one_or_none() is not None
    finally:
        app.dependency_overrides.clear()


@pytest.mark.anyio
@requires_postgres
async def test_accept_invite_new_user():
    raw_token = "valid_token_for_new_user_123456789012345678"
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    invite_id = str(uuid.uuid4())
    email = f"new_invitee_{uuid.uuid4().hex[:6]}@example.com"

    async with db_session() as session:
        invite = SuperAdminInvite(
            id=invite_id,
            email=email,
            token_hash=token_hash,
            status=InviteStatus.PENDING,
            expires_at=datetime.now(tz=UTC) + timedelta(days=2),
        )
        session.add(invite)
        await session.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/v1/auth/super-admin/accept-invite",
            json={
                "token": raw_token,
                "password": "SecurePassword123!",
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["role"] == "super_admin"
        assert "access_token" in data
        assert "recall_super_admin_refresh_token" in res.cookies

    # Verify user created with role super_admin and username set to normalized email
    async with db_session() as session:
        inv = await session.get(SuperAdminInvite, invite_id)
        assert inv.status == InviteStatus.ACCEPTED
        assert inv.created_via_invite is True

        user = await session.get(User, inv.accepted_by)
        assert user is not None
        assert user.role == "super_admin"
        assert user.email == email
        assert user.username == email.strip().lower()


@pytest.mark.anyio
@requires_postgres
async def test_accept_invite_clash_rejected():
    """Verify case-insensitive username or email clash rejects invite with generic error."""
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    invite_id = str(uuid.uuid4())
    clash_email = f"clash_{uuid.uuid4().hex[:6]}@example.com"

    # Pre-create an account whose username clashes case-insensitively with clash_email
    async with db_session() as session:
        existing = User(
            id=str(uuid.uuid4()),
            username=clash_email.upper(),  # case clash
            email=f"other_{uuid.uuid4().hex[:6]}@example.com",
            role="student_individual",
        )
        invite = SuperAdminInvite(
            id=invite_id,
            email=clash_email,
            token_hash=token_hash,
            status=InviteStatus.PENDING,
            expires_at=datetime.now(tz=UTC) + timedelta(days=2),
        )
        session.add_all([existing, invite])
        await session.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/v1/auth/super-admin/accept-invite",
            json={"token": raw_token, "password": "SecurePassword123!"},
        )
        assert res.status_code == 400
        assert "invalid or expired" in res.json()["detail"].lower()


@pytest.mark.anyio
@requires_postgres
async def test_accept_invite_existing_user_promoted():
    raw_token = "valid_token_for_existing_user_1234567890123"
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    invite_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    email = f"existing_teacher_{uuid.uuid4().hex[:6]}@example.com"

    # Pre-create user with admin role
    async with db_session() as session:
        existing = User(
            id=user_id,
            username=f"admin_{uuid.uuid4().hex[:6]}",
            email=email,
            name="Existing Admin",
            role="admin",
        )
        session.add(existing)

        invite = SuperAdminInvite(
            id=invite_id,
            email=email,
            token_hash=token_hash,
            status=InviteStatus.PENDING,
            expires_at=datetime.now(tz=UTC) + timedelta(days=2),
        )
        session.add(invite)
        await session.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/v1/auth/super-admin/accept-invite",
            json={"token": raw_token},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["role"] == "super_admin"

    # Verify existing user promoted, previous_role saved as 'admin'
    async with db_session() as session:
        inv = await session.get(SuperAdminInvite, invite_id)
        assert inv.status == InviteStatus.ACCEPTED
        assert inv.created_via_invite is False
        assert inv.previous_role == "admin"

        user = await session.get(User, user_id)
        assert user.role == "super_admin"
        assert user.previous_role == "admin"


@pytest.mark.anyio
async def test_remove_super_admin_cannot_remove_self():
    actor_id = str(uuid.uuid4())
    app.dependency_overrides[get_current_super_admin] = lambda: {
        "sub": actor_id,
        "username": "current_sa",
        "role": "super_admin",
        "scope": "super_admin",
    }
    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.delete(f"/api/v1/super-admin/admins/{actor_id}")
            assert res.status_code == 400
            assert "cannot remove your own" in res.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.anyio
@requires_postgres
async def test_remove_super_admin_deletes_invite_created_and_demotes_promoted():
    actor_id = str(uuid.uuid4())
    other_sa_id = str(uuid.uuid4())
    promoted_sa_id = str(uuid.uuid4())

    async with db_session() as session:
        # Caller SA
        sa1 = User(
            id=actor_id, username=f"sa1_{uuid.uuid4().hex[:6]}", role="super_admin"
        )
        # Invite-created SA
        sa2 = User(
            id=other_sa_id, username=f"sa2_{uuid.uuid4().hex[:6]}", role="super_admin"
        )
        inv2 = SuperAdminInvite(
            id=str(uuid.uuid4()),
            email=f"sa2_{uuid.uuid4().hex[:6]}@example.com",
            token_hash=f"dummy_hash_2_{uuid.uuid4().hex}",
            status=InviteStatus.ACCEPTED,
            accepted_by=other_sa_id,
            created_via_invite=True,
            expires_at=datetime.now(tz=UTC) + timedelta(days=2),
        )
        # Promoted SA
        sa3 = User(
            id=promoted_sa_id,
            username=f"sa3_{uuid.uuid4().hex[:6]}",
            role="super_admin",
            previous_role="admin",
        )
        inv3 = SuperAdminInvite(
            id=str(uuid.uuid4()),
            email=f"sa3_{uuid.uuid4().hex[:6]}@example.com",
            token_hash=f"dummy_hash_3_{uuid.uuid4().hex}",
            status=InviteStatus.ACCEPTED,
            accepted_by=promoted_sa_id,
            created_via_invite=False,
            previous_role="admin",
            expires_at=datetime.now(tz=UTC) + timedelta(days=2),
        )
        session.add_all([sa1, sa2, inv2, sa3, inv3])
        await session.commit()

    app.dependency_overrides[get_current_super_admin] = lambda: {
        "sub": actor_id,
        "username": "sa1",
        "role": "super_admin",
        "scope": "super_admin",
    }
    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # 1. Remove invite-created SA -> should delete user
            res_del = await client.delete(f"/api/v1/super-admin/admins/{other_sa_id}")
            assert res_del.status_code == 200
            assert res_del.json()["action"] == "deleted"

            async with db_session() as session:
                u2 = await session.get(User, other_sa_id)
                assert u2 is None

            # 2. Remove promoted SA -> should demote to 'admin'
            res_demote = await client.delete(
                f"/api/v1/super-admin/admins/{promoted_sa_id}"
            )
            assert res_demote.status_code == 200
            assert "demoted to admin" in res_demote.json()["action"]

            async with db_session() as session:
                u3 = await session.get(User, promoted_sa_id)
                assert u3 is not None
                assert u3.role == "admin"
                assert u3.previous_role is None
    finally:
        app.dependency_overrides.clear()


@pytest.mark.anyio
@requires_postgres
async def test_concurrent_last_admin_removal_protection_real_postgres():
    """Verify row-level locking (SELECT ... FOR UPDATE) prevents removing the last super admin

    even when two callers concurrently attempt to remove each other.
    """
    admin_a_id = str(uuid.uuid4())
    admin_b_id = str(uuid.uuid4())

    async with db_session() as session:
        # Remove any other super_admins for a clean 2-admin test
        sa_query = await session.execute(select(User).where(User.role == "super_admin"))
        for old_sa in sa_query.scalars().all():
            old_sa.role = "admin"

        user_a = User(
            id=admin_a_id,
            username=f"concurrent_a_{uuid.uuid4().hex[:6]}",
            role="super_admin",
        )
        user_b = User(
            id=admin_b_id,
            username=f"concurrent_b_{uuid.uuid4().hex[:6]}",
            role="super_admin",
        )
        session.add_all([user_a, user_b])
        await session.commit()

    # Function simulating Admin A deleting Admin B
    async def admin_a_removes_b():
        token_a = create_super_admin_jwt(
            admin_a_id, extra_claims={"role": "super_admin", "scope": "super_admin"}
        )
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.delete(
                f"/api/v1/super-admin/admins/{admin_b_id}",
                headers={"Authorization": f"Bearer {token_a}"},
            )

    # Function simulating Admin B deleting Admin A
    async def admin_b_removes_a():
        token_b = create_super_admin_jwt(
            admin_b_id, extra_claims={"role": "super_admin", "scope": "super_admin"}
        )
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.delete(
                f"/api/v1/super-admin/admins/{admin_a_id}",
                headers={"Authorization": f"Bearer {token_b}"},
            )

    # Run both simultaneously against real Postgres with row locking
    res_a, res_b = await asyncio.gather(admin_a_removes_b(), admin_b_removes_a())

    statuses = [res_a.status_code, res_b.status_code]
    # Exactly one must succeed (200) and the other must be rejected (400 - cannot remove last)
    assert 200 in statuses
    assert 400 in statuses

    # Verify exactly 1 super admin remains in the real PostgreSQL database
    async with db_session() as session:
        remaining_res = await session.execute(
            select(User).where(User.role == "super_admin")
        )
        remaining_admins = remaining_res.scalars().all()
        assert len(remaining_admins) == 1

        # Verify self-removal is blocked on the remaining super admin
        remaining_id = remaining_admins[0].id
        token_rem = create_super_admin_jwt(
            remaining_id,
            extra_claims={"role": "super_admin", "scope": "super_admin"},
        )
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            last_res = await client.delete(
                f"/api/v1/super-admin/admins/{remaining_id}",
                headers={"Authorization": f"Bearer {token_rem}"},
            )
            assert last_res.status_code == 400
            assert "cannot remove your own" in last_res.json()["detail"].lower()


@pytest.mark.anyio
@requires_postgres
async def test_seed_super_admin_script(monkeypatch):
    test_email = f"Seed_{uuid.uuid4().hex[:6]}@Example.COM"
    test_pw = "SeedPassword123!"

    # No username provided — seed script sets username to normalized email.
    # DATABASE_URL must be passed because the seed script builds its own engine.
    from app.core.config import get_settings

    monkeypatch.setenv("SUPER_ADMIN_EMAIL", test_email)
    monkeypatch.delenv("SUPER_ADMIN_USERNAME", raising=False)
    monkeypatch.setenv("SUPER_ADMIN_INITIAL_PASSWORD", test_pw)
    monkeypatch.setenv("DATABASE_URL", get_settings().database_url)

    # 1. Clean super admins so seed runs
    async with db_session() as session:
        res = await session.execute(select(User).where(User.role == "super_admin"))
        for u in res.scalars().all():
            u.role = "admin"
        await session.commit()

    # 2. Run seed
    await seed_super_admin()

    # 3. Verify created with username = normalized email
    async with db_session() as session:
        res = await session.execute(
            select(User).where(User.email == test_email.strip().lower())
        )
        created = res.scalar_one_or_none()
        assert created is not None
        assert created.role == "super_admin"
        assert created.username == test_email.strip().lower()
        assert created.force_password_change is True

    # 4. Run seed again -> idempotent no-op
    await seed_super_admin()


@pytest.mark.anyio
@requires_postgres
async def test_seed_super_admin_promotes_existing_user(monkeypatch):
    existing_email = f"Existing_Admin_{uuid.uuid4().hex[:6]}@School.org"
    new_pw = "NewSuperAdminPassword123!"

    from app.core.config import get_settings

    # 1. Clean super admins so seed runs
    async with db_session() as session:
        res = await session.execute(select(User).where(User.role == "super_admin"))
        for u in res.scalars().all():
            u.role = "admin"

        # Pre-create a school admin with this email
        school_admin = User(
            id=str(uuid.uuid4()),
            username="existing_school_admin",
            email=existing_email.strip().lower(),
            role="admin",
        )
        session.add(school_admin)
        await session.commit()

    monkeypatch.setenv("SUPER_ADMIN_EMAIL", existing_email)
    monkeypatch.setenv("SUPER_ADMIN_INITIAL_PASSWORD", new_pw)
    monkeypatch.setenv("DATABASE_URL", get_settings().database_url)

    # 2. Run seed
    await seed_super_admin()

    # 3. Verify promoted to super_admin
    async with db_session() as session:
        res = await session.execute(
            select(User).where(User.email == existing_email.strip().lower())
        )
        user = res.scalar_one_or_none()
        assert user is not None
        assert user.role == "super_admin"
