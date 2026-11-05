from __future__ import annotations

import secrets
import string
import uuid
from datetime import UTC, datetime, time, timedelta

from fastapi import APIRouter, Query
from sqlalchemy import and_, distinct, func, or_, select

from app.api.deps import SuperAdminDep
from app.core.exceptions import BadRequestError, NotFoundError
from app.core.security import hash_password
from app.db.database import db_session
from app.db.models import (
    AccessCode,
    ChatMessage,
    DailyActivity,
    DailyRecallQueue,
    ProcessedWebhook,
    School,
    TopicReview,
    User,
)
from app.schemas.super_admin import (
    AccessCodeItem,
    AccessCodeListResponse,
    FunnelStepItem,
    GenerateCodesRequest,
    GenerateCodesResponse,
    ResetUserRequest,
    ResetUserResponse,
    SignupTrendItem,
    SuperAdminFunnelResponse,
    SuperAdminOverviewResponse,
    SuperAdminSignupAnalyticsResponse,
    SuperAdminUserItem,
    SuperAdminUsersListResponse,
)

router = APIRouter(prefix="/super-admin", tags=["super-admin"])


@router.get("/overview", response_model=SuperAdminOverviewResponse)
async def get_super_admin_overview(_: SuperAdminDep) -> SuperAdminOverviewResponse:
    """Return high-level operational metrics: online-now, signups today, user roles, code & payment counts."""
    now = datetime.now(UTC)
    five_min_ago = now - timedelta(minutes=5)
    today_start = datetime.combine(now.date(), time.min, tzinfo=UTC)

    async with db_session() as session:
        # Online users in last 5 minutes
        online_res = await session.execute(
            select(func.count(User.id)).where(User.last_seen_at >= five_min_ago)
        )
        online_users = online_res.scalar_one()

        # Total users
        total_res = await session.execute(select(func.count(User.id)))
        total_users = total_res.scalar_one()

        # Signups today
        today_res = await session.execute(
            select(func.count(User.id)).where(User.created_at >= today_start)
        )
        signups_today = today_res.scalar_one()

        # Users grouped by role
        role_res = await session.execute(
            select(User.role, func.count(User.id)).group_by(User.role)
        )
        users_by_role = {role: count for role, count in role_res.all()}

        # Access codes grouped by status
        code_res = await session.execute(
            select(AccessCode.status, func.count(AccessCode.id)).group_by(
                AccessCode.status
            )
        )
        access_codes_summary = {status: count for status, count in code_res.all()}

        # Payments count
        webhook_res = await session.execute(
            select(func.count(ProcessedWebhook.reference))
        )
        processed_payments_count = webhook_res.scalar_one()

        return SuperAdminOverviewResponse(
            online_users=online_users,
            total_users=total_users,
            signups_today=signups_today,
            users_by_role=users_by_role,
            access_codes_summary=access_codes_summary,
            processed_payments_count=processed_payments_count,
        )


@router.get("/users", response_model=SuperAdminUsersListResponse)
async def list_users(
    _: SuperAdminDep,
    role: str | None = Query(default=None),
    is_online: bool | None = Query(default=None),
    search: str | None = Query(default=None),
    school_id: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> SuperAdminUsersListResponse:
    """Paginated user list with role, online status, search filter, and school metadata."""
    now = datetime.now(UTC)
    five_min_ago = now - timedelta(minutes=5)

    async with db_session() as session:
        query = select(User, School.name.label("school_name")).outerjoin(
            School, User.org_id == School.id
        )

        conditions = []
        if role:
            conditions.append(User.role == role)
        if school_id:
            conditions.append(User.org_id == school_id)
        if is_online is True:
            conditions.append(User.last_seen_at >= five_min_ago)
        elif is_online is False:
            conditions.append(
                or_(User.last_seen_at.is_(None), User.last_seen_at < five_min_ago)
            )
        if search:
            search_pattern = f"%{search.strip()}%"
            conditions.append(
                or_(
                    User.username.ilike(search_pattern),
                    User.name.ilike(search_pattern),
                    User.email.ilike(search_pattern),
                )
            )

        if conditions:
            query = query.where(and_(*conditions))

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = (await session.execute(count_query)).scalar_one()

        # Pagination & sorting
        offset = (page - 1) * page_size
        query = query.order_by(User.created_at.desc()).offset(offset).limit(page_size)

        result = await session.execute(query)
        items = []
        for user, s_name in result.all():
            online = user.last_seen_at is not None and user.last_seen_at >= five_min_ago
            items.append(
                SuperAdminUserItem(
                    id=user.id,
                    username=user.username,
                    email=user.email,
                    name=user.name,
                    role=user.role,
                    org_id=user.org_id,
                    school_name=s_name,
                    created_at=user.created_at,
                    last_seen_at=user.last_seen_at,
                    is_online=online,
                    force_password_change=user.force_password_change,
                )
            )

        total_pages = max(1, (total + page_size - 1) // page_size)
        return SuperAdminUsersListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )


@router.get("/analytics/signups", response_model=SuperAdminSignupAnalyticsResponse)
async def get_signup_trends(
    _: SuperAdminDep,
    days: int = Query(default=14, ge=1, le=90),
) -> SuperAdminSignupAnalyticsResponse:
    """Return daily signup trends broken down by role over the requested window."""
    now = datetime.now(UTC)
    start_date = (now - timedelta(days=days)).date()

    async with db_session() as session:
        # Group by date and role
        date_trunc = func.date(User.created_at).label("signup_date")
        query = (
            select(date_trunc, User.role, func.count(User.id))
            .where(func.date(User.created_at) >= start_date)
            .group_by(date_trunc, User.role)
            .order_by(date_trunc.asc())
        )
        res = await session.execute(query)
        rows = res.all()

        daily_map: dict[str, dict[str, int]] = {}
        # Prepopulate all dates in range
        for d in range(days + 1):
            curr_d = (start_date + timedelta(days=d)).isoformat()
            daily_map[curr_d] = {}

        total_signups = 0
        for s_date, role, count in rows:
            d_str = str(s_date)
            if d_str not in daily_map:
                daily_map[d_str] = {}
            daily_map[d_str][role] = count
            total_signups += count

        trends = [
            SignupTrendItem(
                date=d_key,
                count=sum(role_counts.values()),
                by_role=role_counts,
            )
            for d_key, role_counts in sorted(daily_map.items())
        ]

        return SuperAdminSignupAnalyticsResponse(
            days=days,
            total_signups=total_signups,
            daily_trends=trends,
        )


@router.get("/analytics/funnel", response_model=SuperAdminFunnelResponse)
async def get_beta_funnel(_: SuperAdminDep) -> SuperAdminFunnelResponse:
    """Compute the 6-step beta onboarding and learning retention funnel:
    1. Signed up
    2. Activated (paid or redeemed code)
    3. Opened a topic
    4. Finished practice (Step 4)
    5. Returned next day
    6. Completed a review
    """
    async with db_session() as session:
        # Step 1: Total signed-up students
        s1_res = await session.execute(
            select(func.count(User.id)).where(
                User.role.in_(["student_individual", "student_org"])
            )
        )
        step1_count = s1_res.scalar_one()

        # Step 2: Activated (All student_org are activated by definition; student_individual with activated code)
        s2_res = await session.execute(
            select(func.count(distinct(User.id)))
            .outerjoin(AccessCode, AccessCode.activated_by == User.id)
            .where(
                User.role.in_(["student_individual", "student_org"]),
                or_(
                    User.role == "student_org",
                    AccessCode.status == "active",
                ),
            )
        )
        step2_count = s2_res.scalar_one()

        # Step 3: Opened a topic (User has chat messages, topic review attempt, or daily activity)
        s3_res = await session.execute(
            select(func.count(distinct(User.id)))
            .outerjoin(TopicReview, TopicReview.user_id == User.id)
            .outerjoin(ChatMessage, ChatMessage.user_id == User.id)
            .outerjoin(DailyActivity, DailyActivity.user_id == User.id)
            .where(
                User.role.in_(["student_individual", "student_org"]),
                or_(
                    TopicReview.id.is_not(None),
                    ChatMessage.id.is_not(None),
                    DailyActivity.id.is_not(None),
                ),
            )
        )
        step3_count = s3_res.scalar_one()

        # Step 4: Finished practice (Step 4 review completed)
        s4_res = await session.execute(
            select(func.count(distinct(TopicReview.user_id))).where(
                or_(
                    TopicReview.accuracy_score.is_not(None),
                    TopicReview.last_reviewed_at.is_not(None),
                )
            )
        )
        step4_count = s4_res.scalar_one()

        # Step 5: Returned next day (Activity on at least 2 distinct days, or last_seen_at >= 24h after created_at)
        s5_res = await session.execute(
            select(func.count(distinct(User.id))).where(
                User.role.in_(["student_individual", "student_org"]),
                or_(
                    User.last_seen_at >= User.created_at + timedelta(hours=24),
                    User.id.in_(
                        select(DailyActivity.user_id)
                        .group_by(DailyActivity.user_id)
                        .having(func.count(distinct(DailyActivity.activity_date)) >= 2)
                    ),
                ),
            )
        )
        step5_count = s5_res.scalar_one()

        # Step 6: Completed a review (repetitions >= 1 or completed daily recall queue)
        s6_res = await session.execute(
            select(func.count(distinct(User.id))).where(
                User.role.in_(["student_individual", "student_org"]),
                or_(
                    User.id.in_(
                        select(TopicReview.user_id).where(TopicReview.repetitions >= 1)
                    ),
                    User.id.in_(
                        select(DailyRecallQueue.user_id).where(
                            DailyRecallQueue.completed == 1
                        )
                    ),
                ),
            )
        )
        step6_count = s6_res.scalar_one()

        raw_counts = [
            (1, "Signed Up", "Total registered students", step1_count),
            (2, "Activated", "Paid or redeemed an access code", step2_count),
            (
                3,
                "Opened Topic",
                "Opened learning interface or chatted with tutor",
                step3_count,
            ),
            (
                4,
                "Finished Practice",
                "Completed Step 4 practice questions",
                step4_count,
            ),
            (
                5,
                "Returned Next Day",
                "Active on a subsequent day (D1 retention)",
                step5_count,
            ),
            (
                6,
                "Completed Review",
                "Advanced SM-2 interval or completed a scheduled review",
                step6_count,
            ),
        ]

        steps: list[FunnelStepItem] = []
        base_count = max(1, step1_count)
        prev_count = base_count

        for step_num, name, desc, cnt in raw_counts:
            conv_first = round((cnt / base_count) * 100, 1) if step1_count > 0 else 0.0
            conv_prev = (
                round((cnt / max(1, prev_count)) * 100, 1) if prev_count > 0 else 0.0
            )
            steps.append(
                FunnelStepItem(
                    step=step_num,
                    name=name,
                    description=desc,
                    count=cnt,
                    conversion_from_first=conv_first,
                    conversion_from_previous=conv_prev,
                )
            )
            prev_count = cnt

        return SuperAdminFunnelResponse(
            total_students=step1_count,
            funnel=steps,
        )


# ── Support Actions ────────────────────────────────────────────────────────


@router.post("/users/{user_id}/reset", response_model=ResetUserResponse)
async def reset_user(
    user_id: str,
    payload: ResetUserRequest,
    _: SuperAdminDep,
) -> ResetUserResponse:
    """Reset a user's session, device fingerprint, or password (support action)."""
    async with db_session() as session:
        user_res = await session.execute(select(User).where(User.id == user_id))
        user = user_res.scalar_one_or_none()
        if not user:
            raise NotFoundError("User not found.")

        temp_password = None
        if payload.reset_session:
            user.current_session_id = str(uuid.uuid4())

        if payload.clear_device_fingerprint:
            user.device_fingerprint = None

        if payload.new_password:
            user.password_hash = await hash_password(payload.new_password)
            user.force_password_change = payload.force_password_change
        elif payload.force_password_change:
            # Generate a secure 10-char temporary password
            alphabet = string.ascii_letters + string.digits
            temp_password = "".join(secrets.choice(alphabet) for _ in range(10))
            user.password_hash = await hash_password(temp_password)
            user.force_password_change = True

        await session.commit()

        msg_parts = []
        if payload.reset_session:
            msg_parts.append("session invalidated")
        if payload.clear_device_fingerprint:
            msg_parts.append("device fingerprint cleared")
        if payload.new_password or temp_password:
            msg_parts.append("password reset")

        msg = (
            "User reset successfully: " + ", ".join(msg_parts)
            if msg_parts
            else "No changes applied."
        )
        return ResetUserResponse(
            success=True,
            message=msg,
            temporary_password=temp_password,
        )


@router.delete("/users/{user_id}")
async def remove_user(
    user_id: str,
    admin_claims: SuperAdminDep,
) -> dict:
    """Permanently delete a user account (cannot delete own super admin account)."""
    if user_id == admin_claims["sub"]:
        raise BadRequestError("Cannot delete your own super admin account.")

    async with db_session() as session:
        user_res = await session.execute(select(User).where(User.id == user_id))
        user = user_res.scalar_one_or_none()
        if not user:
            raise NotFoundError("User not found.")

        await session.delete(user)
        await session.commit()

    return {"message": f"User {user.username} successfully deleted."}


@router.get("/codes", response_model=AccessCodeListResponse)
async def list_access_codes(
    _: SuperAdminDep,
    type: str | None = Query(default=None),
    status: str | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> AccessCodeListResponse:
    """List access codes across the entire platform with pagination and filters."""
    async with db_session() as session:
        query = (
            select(
                AccessCode,
                School.name.label("school_name"),
                User.username.label("activated_by_username"),
            )
            .outerjoin(School, AccessCode.school_id == School.id)
            .outerjoin(User, AccessCode.activated_by == User.id)
        )

        conditions = []
        if type:
            conditions.append(AccessCode.type == type)
        if status:
            conditions.append(AccessCode.status == status)
        if search:
            query_str = f"%{search.strip().upper()}%"
            conditions.append(AccessCode.code.ilike(query_str))

        if conditions:
            query = query.where(and_(*conditions))

        count_query = select(func.count()).select_from(query.subquery())
        total = (await session.execute(count_query)).scalar_one()

        offset = (page - 1) * page_size
        query = (
            query.order_by(AccessCode.created_at.desc()).offset(offset).limit(page_size)
        )

        result = await session.execute(query)
        items = []
        for code_row, s_name, u_name in result.all():
            items.append(
                AccessCodeItem(
                    id=code_row.id,
                    code=code_row.code,
                    type=code_row.type,
                    status=code_row.status,
                    school_id=code_row.school_id,
                    school_name=s_name,
                    activated_by=code_row.activated_by,
                    activated_by_username=u_name,
                    activated_at=code_row.activated_at,
                    expires_at=code_row.expires_at,
                    created_at=code_row.created_at,
                )
            )

        total_pages = max(1, (total + page_size - 1) // page_size)
        return AccessCodeListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )


@router.post("/codes/generate", response_model=GenerateCodesResponse)
async def generate_codes(
    payload: GenerateCodesRequest,
    _: SuperAdminDep,
) -> GenerateCodesResponse:
    """Generate free bulk access codes (e.g. for beta testers or schools)."""
    if payload.type == "org" and not payload.school_id:
        raise BadRequestError("school_id is required for org access codes.")

    now = datetime.now(UTC)
    expires_at = now + timedelta(days=payload.duration_months * 30)

    codes_to_add: list[AccessCode] = []
    generated_strings: list[str] = []

    prefix = payload.prefix.strip().upper()
    async with db_session() as session:
        if payload.school_id:
            s_res = await session.execute(
                select(School.id).where(School.id == payload.school_id)
            )
            if not s_res.scalar_one_or_none():
                raise NotFoundError("School not found.")

        for _ in range(payload.count):
            random_part = uuid.uuid4().hex[:8].upper()
            code_str = f"{prefix}-{random_part}"
            generated_strings.append(code_str)

            codes_to_add.append(
                AccessCode(
                    id=str(uuid.uuid4()),
                    code=code_str,
                    type=payload.type,
                    status="pending",
                    school_id=payload.school_id,
                    created_at=now,
                    expires_at=expires_at,
                )
            )

        session.add_all(codes_to_add)
        await session.commit()

    return GenerateCodesResponse(
        count=len(generated_strings),
        type=payload.type,
        codes=generated_strings,
    )


@router.post("/codes/{code_id}/revoke")
async def revoke_code(
    code_id: str,
    _: SuperAdminDep,
) -> dict:
    """Revoke any access code platform-wide."""
    async with db_session() as session:
        res = await session.execute(select(AccessCode).where(AccessCode.id == code_id))
        code = res.scalar_one_or_none()
        if not code:
            raise NotFoundError("Access code not found.")

        code.status = "revoked"
        await session.commit()

    return {"message": f"Access code {code.code} has been revoked."}


@router.post("/codes/{code_id}/reactivate")
async def reactivate_code(
    code_id: str,
    _: SuperAdminDep,
) -> dict:
    """Reactivate a revoked access code platform-wide."""
    async with db_session() as session:
        res = await session.execute(select(AccessCode).where(AccessCode.id == code_id))
        code = res.scalar_one_or_none()
        if not code:
            raise NotFoundError("Access code not found.")

        # If it was previously activated by a user, restore to active, else pending
        code.status = "active" if code.activated_by else "pending"
        await session.commit()

    return {
        "message": f"Access code {code.code} has been reactivated to {code.status}."
    }
