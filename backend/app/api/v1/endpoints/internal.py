from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Request
from sqlalchemy import update

from app.api.deps import SuperAdminDep
from app.core.enums import AuditAction
from app.core.exceptions import BadRequestError
from app.db.database import db_session
from app.db.models import Topic, User
from app.services.audit import get_client_ip, write_audit_log

router = APIRouter()


@router.patch("/topics/{topic_id}/approve")
async def approve_topic(
    topic_id: UUID,
    admin_claims: SuperAdminDep,
    request: Request,
):
    """
    Move topic from draft -> approved.
    Internal only (Super admin). Reject any other starting status with a 400 error.
    """
    client_ip = get_client_ip(request)
    async with db_session() as session:
        result = await session.execute(
            update(Topic)
            .where(Topic.id == str(topic_id), Topic.status == "draft")
            .values(status="approved")
        )
        if result.rowcount == 0:
            raise BadRequestError(
                "Topic must be in 'draft' status to be approved, or topic does not exist."
            )

        admin_user = await session.get(User, admin_claims["sub"])
        actor_username = admin_user.username if admin_user else "unknown"

        await write_audit_log(
            session,
            actor_user_id=admin_claims["sub"],
            actor_username=actor_username,
            action=AuditAction.TOPIC_APPROVE,
            target_type="topic",
            target_id=str(topic_id),
            details={"previous_status": "draft", "new_status": "approved"},
            ip=client_ip,
        )
        await session.commit()

    return {"status": "success", "message": f"Topic {topic_id} approved."}


@router.patch("/topics/{topic_id}/publish")
async def publish_topic(
    topic_id: UUID,
    admin_claims: SuperAdminDep,
    request: Request,
):
    """
    Move topic from approved -> published.
    Internal only (Super admin). Reject any other starting status with a 400 error.
    """
    client_ip = get_client_ip(request)
    async with db_session() as session:
        result = await session.execute(
            update(Topic)
            .where(Topic.id == str(topic_id), Topic.status == "approved")
            .values(status="published")
        )
        if result.rowcount == 0:
            raise BadRequestError(
                "Topic must be in 'approved' status to be published, or topic does not exist."
            )

        admin_user = await session.get(User, admin_claims["sub"])
        actor_username = admin_user.username if admin_user else "unknown"

        await write_audit_log(
            session,
            actor_user_id=admin_claims["sub"],
            actor_username=actor_username,
            action=AuditAction.TOPIC_PUBLISH,
            target_type="topic",
            target_id=str(topic_id),
            details={"previous_status": "approved", "new_status": "published"},
            ip=client_ip,
        )
        await session.commit()

    return {"status": "success", "message": f"Topic {topic_id} published."}
