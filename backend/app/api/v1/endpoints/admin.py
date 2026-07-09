"""Admin-only endpoints: access code management."""

from __future__ import annotations

import csv
from datetime import UTC, datetime
from io import StringIO

from fastapi import APIRouter
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy import func, select, update

from app.api.deps import AdminDep
from app.core.exceptions import NotFoundError
from app.db.database import db_session
from app.db.models import AccessCode, Subject, TopicReview, User

router = APIRouter(tags=["admin"])


class RevokeRequest(BaseModel):
    code_id: str


@router.get("/codes/download")
async def download_codes(
    claims: AdminDep,
    status: str | None = None,
) -> Response:
    """Download access codes as CSV (admin only)."""
    async with db_session() as session:
        query = select(AccessCode)
        if status:
            query = query.where(AccessCode.status == status)
        # BOLA protection: org admins can only see their own school's codes
        org_id = claims.get("org_id")
        if org_id:
            query = query.where(AccessCode.school_id == org_id)
        result = await session.execute(query)
        codes = result.scalars().all()

    with StringIO() as output:
        writer = csv.writer(output)
        writer.writerow(["code", "status", "activated_by", "device_fingerprint"])
        for c in codes:
            writer.writerow([c.code, c.status, c.activated_by, c.device_fingerprint])
        csv_data = output.getvalue()

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=access_codes.csv"},
    )


@router.post("/codes/revoke")
async def revoke_code(
    payload: RevokeRequest,
    claims: AdminDep,
) -> dict:
    """Revoke an access code (admin only)."""
    async with db_session() as session:
        stmt = update(AccessCode).where(AccessCode.id == payload.code_id)
        # BOLA protection: org admins scoped to their own school
        org_id = claims.get("org_id")
        if org_id:
            stmt = stmt.where(AccessCode.school_id == org_id)

        result = await session.execute(
            stmt.values(status="revoked").returning(AccessCode.code)
        )
        updated = result.scalar_one_or_none()
        if not updated:
            raise NotFoundError("Code not found or you do not have permission to revoke it.")
        await session.commit()
        return {"message": f"Code {updated} revoked."}


@router.get("/stats")
async def get_admin_stats(
    claims: AdminDep,
) -> dict:
    """Get dashboard stats for admin (scoped to school/org if claims have org_id)."""
    org_id = claims.get("org_id")
    now = datetime.now(UTC)

    async with db_session() as session:
        # 1. Total students
        student_roles = ["student_individual", "student_org"]
        total_students_stmt = select(func.count(User.id)).where(User.role.in_(student_roles))
        if org_id:
            total_students_stmt = total_students_stmt.where(User.org_id == org_id)
        
        total_students_result = await session.execute(total_students_stmt)
        total_students = total_students_result.scalar() or 0

        # 2. Average accuracy across students
        avg_accuracy_stmt = select(func.avg(TopicReview.accuracy_score)).join(
            User, TopicReview.user_id == User.id
        )
        if org_id:
            avg_accuracy_stmt = avg_accuracy_stmt.where(User.org_id == org_id)
        
        avg_accuracy_result = await session.execute(avg_accuracy_stmt)
        avg_accuracy = avg_accuracy_result.scalar()
        avg_accuracy = float(round(avg_accuracy, 2)) if avg_accuracy is not None else 0.0

        # 3. Count of students with overdue recall (next_review_at < now)
        overdue_stmt = select(func.count(func.distinct(TopicReview.user_id))).join(
            User, TopicReview.user_id == User.id
        ).where(TopicReview.next_review_at < now)
        if org_id:
            overdue_stmt = overdue_stmt.where(User.org_id == org_id)
        
        overdue_result = await session.execute(overdue_stmt)
        overdue_recall_count = overdue_result.scalar() or 0

        # 4. Count of active subjects
        subject_count_stmt = select(func.count(Subject.id))
        subject_count_result = await session.execute(subject_count_stmt)
        active_subjects_count = subject_count_result.scalar() or 0

    return {
        "total_students": total_students,
        "avg_accuracy": avg_accuracy,
        "overdue_recall_count": overdue_recall_count,
        "active_subjects_count": active_subjects_count,
    }
