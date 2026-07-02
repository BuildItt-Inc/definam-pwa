import csv
from io import StringIO

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select, update

from app.core.auth import get_current_user
from app.db.database import db_session
from app.db.models import AccessCode

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

class RevokeRequest(BaseModel):
    code_id: str

@router.get("/codes/download")
async def download_codes(
    status: str | None = None,
    user=Depends(get_current_user)
):
    """Download access codes as CSV (admin only)."""
    if user.role != "admin":
        raise HTTPException(403, "Admin only")
    async with db_session() as session:
        query = select(AccessCode)
        if status:
            query = query.where(AccessCode.status == status)
        if user.org_id:
            query = query.where(AccessCode.school_id == user.org_id)
        result = await session.execute(query)
        codes = result.scalars().all()
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["code", "status", "activated_by", "device_fingerprint"])
    for c in codes:
        writer.writerow([c.code, c.status, c.activated_by, c.device_fingerprint])
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=access_codes.csv"}
    )

@router.post("/codes/revoke")
async def revoke_code(
    payload: RevokeRequest,
    user=Depends(get_current_user)
):
    """Revoke an access code (admin only)."""
    if user.role != "admin":
        raise HTTPException(403, "Admin only")
    async with db_session() as session:
        result = await session.execute(
            update(AccessCode)
            .where(AccessCode.id == payload.code_id)
            .values(status="revoked")
            .returning(AccessCode.code)
        )
        updated = result.scalar_one_or_none()
        if not updated:
            raise HTTPException(404, "Code not found")
        await session.commit()
        return {"message": f"Code {updated} revoked"}