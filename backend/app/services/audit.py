from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import AuditAction
from app.db.models import AuditLog


def get_client_ip(request: Request | None) -> str | None:
    """Extract client IP from request headers or socket."""
    if not request:
        return None
    xff = request.headers.get("x-forwarded-for", "")
    client_ip = (
        xff.split(",")[0].strip()
        if xff
        else request.headers.get("x-real-ip", "").strip()
        or (request.client.host if request.client else None)
    )
    return client_ip or None


async def write_audit_log(
    session: AsyncSession,
    *,
    actor_user_id: str | None,
    actor_username: str,
    action: AuditAction | str,
    target_type: str | None = None,
    target_id: str | None = None,
    details: dict[str, Any] | None = None,
    ip: str | None = None,
) -> AuditLog:
    """
    Append an entry to the audit log in the given session/transaction.
    Adds the AuditLog to `session` without committing, ensuring the action
    and its audit record succeed or fail atomically.
    """
    entry = AuditLog(
        id=str(uuid.uuid4()),
        actor_user_id=actor_user_id,
        actor_username=actor_username,
        action=str(action.value if isinstance(action, AuditAction) else action),
        target_type=target_type,
        target_id=str(target_id) if target_id is not None else None,
        details=details,
        ip=ip,
        created_at=datetime.now(tz=UTC),
    )
    session.add(entry)
    return entry
