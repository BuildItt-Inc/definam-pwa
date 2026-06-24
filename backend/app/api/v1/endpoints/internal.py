from __future__ import annotations

from fastapi import APIRouter, HTTPException, Depends

from app.api.deps import AdminDep
from app.db import database

router = APIRouter()

@router.patch("/topics/{topic_id}/approve")
async def approve_topic(
    topic_id: str,
    _: AdminDep,
):
    """
    Move topic from draft -> approved.
    Internal only. Reject any other starting status with a 400 error.
    """
    success = await database.update_topic_status(topic_id, "draft", "approved")
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Topic must be in 'draft' status to be approved, or topic does not exist.",
        )
    return {"status": "success", "message": f"Topic {topic_id} approved."}


@router.patch("/topics/{topic_id}/publish")
async def publish_topic(
    topic_id: str,
    _: AdminDep,
):
    """
    Move topic from approved -> published.
    Internal only. Reject any other starting status with a 400 error.
    """
    success = await database.update_topic_status(topic_id, "approved", "published")
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Topic must be in 'approved' status to be published, or topic does not exist.",
        )
    return {"status": "success", "message": f"Topic {topic_id} published."}
