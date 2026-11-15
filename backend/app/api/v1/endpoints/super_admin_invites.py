"""Super admin management and invite endpoints.

Mounted under the super_admin router with prefix="/admins", resulting in:
  - GET    /api/v1/super-admin/admins
  - POST   /api/v1/super-admin/admins/invite
  - GET    /api/v1/super-admin/admins/invites
  - POST   /api/v1/super-admin/admins/invite/{id}/revoke
  - DELETE /api/v1/super-admin/admins/{user_id}
"""

from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Request
from sqlalchemy import select

from app.api.deps import SuperAdminDep
from app.core.email import send_super_admin_invite
from app.core.enums import AuditAction, InviteStatus
from app.core.exceptions import BadRequestError, NotFoundError
from app.core.limiter import limiter
from app.db.database import db_session
from app.db.models import SuperAdminInvite, User
from app.schemas.super_admin import (
    SuperAdminInviteItem,
    SuperAdminInviteListResponse,
    SuperAdminInviteRequest,
    SuperAdminItem,
    SuperAdminListResponse,
)
from app.services.audit import get_client_ip, write_audit_log

router = APIRouter(prefix="/admins", tags=["super-admin"])

_INVITE_TTL_HOURS = 48


def _hash_token(raw: str) -> str:
    """SHA-256 hex digest of a raw invite token."""
    return hashlib.sha256(raw.encode()).hexdigest()


def _invite_is_expired(invite: SuperAdminInvite) -> bool:
    return invite.expires_at < datetime.now(tz=UTC)


def _invite_to_item(
    invite: SuperAdminInvite, inviter_username: str | None
) -> SuperAdminInviteItem:
    is_expired = _invite_is_expired(invite)
    # Display status: show 'expired' when past TTL and still pending.
    display_status = (
        InviteStatus.EXPIRED
        if (invite.status == InviteStatus.PENDING and is_expired)
        else invite.status
    )
    return SuperAdminInviteItem(
        id=invite.id,
        email=invite.email,
        status=display_status,
        invited_by_username=inviter_username,
        created_at=invite.created_at,
        expires_at=invite.expires_at,
        accepted_at=invite.accepted_at,
        is_expired=is_expired,
    )


# ── List super admins ──────────────────────────────────────────────────────


@router.get("", response_model=SuperAdminListResponse)
async def list_super_admins(_: SuperAdminDep) -> SuperAdminListResponse:
    """Return all current super admin accounts."""
    async with db_session() as session:
        result = await session.execute(
            select(User)
            .where(User.role == "super_admin")
            .order_by(User.created_at.asc())
        )
        admins = result.scalars().all()
        return SuperAdminListResponse(
            items=[
                SuperAdminItem(
                    id=a.id,
                    username=a.username,
                    email=a.email,
                    name=a.name,
                    created_at=a.created_at,
                    last_seen_at=a.last_seen_at,
                )
                for a in admins
            ],
            total=len(admins),
        )


# ── Send invite ────────────────────────────────────────────────────────────


@router.post("/invite", status_code=201)
@limiter.limit("3/minute")
async def invite_super_admin(
    body: SuperAdminInviteRequest,
    claims: SuperAdminDep,
    request: Request,
) -> dict:
    """
    Create a single-use invite and email it to the invitee.

    If the email send fails the invite row is rolled back so no orphaned
    valid token is left in the database.
    """
    actor_id: str = claims["sub"]
    actor_username: str = claims.get("username", actor_id)

    raw_token = secrets.token_urlsafe(32)
    token_hash = _hash_token(raw_token)
    now = datetime.now(tz=UTC)
    expires_at = now + timedelta(hours=_INVITE_TTL_HOURS)
    invite_id = str(uuid.uuid4())

    async with db_session() as session:
        # Duplicate pending invite guard: reject if a pending, non-expired
        # invite for this email already exists (idempotency for the caller).
        existing = await session.execute(
            select(SuperAdminInvite).where(
                SuperAdminInvite.email == body.email,
                SuperAdminInvite.status == InviteStatus.PENDING,
                SuperAdminInvite.expires_at > now,
            )
        )
        if existing.scalar_one_or_none() is not None:
            raise BadRequestError("A pending invite for this email already exists.")

        invite = SuperAdminInvite(
            id=invite_id,
            email=body.email,
            token_hash=token_hash,
            status=InviteStatus.PENDING,
            invited_by=actor_id,
            expires_at=expires_at,
        )
        session.add(invite)

        # Attempt email send before committing. If it fails we raise so the
        # transaction rolls back — no orphaned token in the DB.
        try:
            await send_super_admin_invite(body.email, raw_token)
        except Exception as exc:
            raise BadRequestError(
                f"Failed to send invite email: {exc}. Invite was not created."
            ) from exc

        await write_audit_log(
            session,
            actor_user_id=actor_id,
            actor_username=actor_username,
            action=AuditAction.SUPERADMIN_INVITE,
            target_type="invite",
            target_id=invite_id,
            details={"email": body.email},
            ip=get_client_ip(request),
        )
        await session.commit()

    return {"id": invite_id, "email": body.email, "status": InviteStatus.PENDING}


# ── List invites ───────────────────────────────────────────────────────────


@router.get("/invites", response_model=SuperAdminInviteListResponse)
async def list_super_admin_invites(_: SuperAdminDep) -> SuperAdminInviteListResponse:
    """Return all super admin invites with computed expiry status."""
    async with db_session() as session:
        result = await session.execute(
            select(SuperAdminInvite).order_by(SuperAdminInvite.created_at.desc())
        )
        invites = result.scalars().all()

        # Batch-load inviter usernames to avoid N+1 queries.
        inviter_ids = {i.invited_by for i in invites if i.invited_by}
        inviter_map: dict[str, str] = {}
        if inviter_ids:
            users_res = await session.execute(
                select(User.id, User.username).where(User.id.in_(inviter_ids))
            )
            inviter_map = {uid: uname for uid, uname in users_res.all()}

        items = [
            _invite_to_item(inv, inviter_map.get(inv.invited_by or ""))
            for inv in invites
        ]
        return SuperAdminInviteListResponse(items=items, total=len(items))


# ── Revoke invite ──────────────────────────────────────────────────────────


@router.post("/invite/{invite_id}/revoke")
async def revoke_super_admin_invite(
    invite_id: str,
    claims: SuperAdminDep,
    request: Request,
) -> dict:
    """Revoke a pending invite. Accepted or already-revoked invites cannot be revoked."""
    actor_id: str = claims["sub"]
    actor_username: str = claims.get("username", actor_id)

    async with db_session() as session:
        invite = await session.get(SuperAdminInvite, invite_id)
        if invite is None:
            raise NotFoundError("Invite not found.")
        if invite.status != InviteStatus.PENDING:
            raise BadRequestError(
                f"Cannot revoke an invite with status '{invite.status}'."
            )

        invite.status = InviteStatus.REVOKED

        await write_audit_log(
            session,
            actor_user_id=actor_id,
            actor_username=actor_username,
            action=AuditAction.SUPERADMIN_INVITE_REVOKE,
            target_type="invite",
            target_id=invite_id,
            details={"email": invite.email},
            ip=get_client_ip(request),
        )
        await session.commit()

    return {"id": invite_id, "status": InviteStatus.REVOKED}


# ── Remove super admin ─────────────────────────────────────────────────────


@router.delete("/{user_id}")
async def remove_super_admin(
    user_id: str,
    claims: SuperAdminDep,
    request: Request,
) -> dict:
    """
    Demote or delete a super admin.

    Rules:
    - Cannot remove yourself.
    - Cannot remove the last super admin (uses SELECT FOR UPDATE row-level
      lock to prevent concurrent race conditions).
    - If the account was created via invite (created_via_invite=True on the
      invite row): delete the User row.
    - If the account was an existing user promoted via invite
      (created_via_invite=False): restore their previous_role.
    - If no invite row is found: demote to 'admin' as a safe fallback.
    - Invalidates all sessions by rotating current_session_id.
    """
    actor_id: str = claims["sub"]
    actor_username: str = claims.get("username", actor_id)

    if user_id == actor_id:
        raise BadRequestError("You cannot remove your own super admin account.")

    async with db_session() as session:
        # Row-level lock on all super_admin rows prevents concurrent last-admin removal.
        lock_res = await session.execute(
            select(User).where(User.role == "super_admin").with_for_update()
        )
        super_admins = lock_res.scalars().all()
        if len(super_admins) <= 1:
            raise BadRequestError("Cannot remove the last super admin.")

        target = next((u for u in super_admins if u.id == user_id), None)
        if target is None:
            raise NotFoundError("Super admin not found.")

        # Find the most recent accepted invite for this user (by accepted_by).
        invite_res = await session.execute(
            select(SuperAdminInvite)
            .where(
                SuperAdminInvite.accepted_by == user_id,
                SuperAdminInvite.status == InviteStatus.ACCEPTED,
            )
            .order_by(SuperAdminInvite.accepted_at.desc())
            .limit(1)
        )
        invite = invite_res.scalar_one_or_none()

        if invite is not None and invite.created_via_invite:
            # Account was created for this invite -> delete the user.
            action_detail = "deleted"
            await session.delete(target)
        else:
            # Existing user was promoted -> restore previous role.
            restore_role = (
                invite.previous_role
                if (invite and invite.previous_role)
                else (target.previous_role or "admin")
            )
            target.role = restore_role
            target.previous_role = None
            target.current_session_id = str(uuid.uuid4())  # invalidate sessions
            action_detail = f"demoted to {restore_role}"

        await write_audit_log(
            session,
            actor_user_id=actor_id,
            actor_username=actor_username,
            action=AuditAction.SUPERADMIN_REMOVE,
            target_type="user",
            target_id=user_id,
            details={"action": action_detail, "target_username": target.username},
            ip=get_client_ip(request),
        )
        await session.commit()

    return {"user_id": user_id, "action": action_detail}
