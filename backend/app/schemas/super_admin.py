from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


class SuperAdminOverviewResponse(BaseModel):
    online_users: int
    total_users: int
    signups_today: int
    users_by_role: dict[str, int]
    access_codes_summary: dict[str, int]
    processed_payments_count: int


class SuperAdminUserItem(BaseModel):
    id: str
    username: str
    email: str | None = None
    name: str | None = None
    role: str
    org_id: str | None = None
    school_name: str | None = None
    created_at: datetime
    last_seen_at: datetime | None = None
    is_online: bool
    force_password_change: bool


class SuperAdminUsersListResponse(BaseModel):
    items: list[SuperAdminUserItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class SignupTrendItem(BaseModel):
    date: str
    count: int
    by_role: dict[str, int]


class SuperAdminSignupAnalyticsResponse(BaseModel):
    days: int
    total_signups: int
    daily_trends: list[SignupTrendItem]


class TractionMetrics(BaseModel):
    signups: int
    active_users: int
    topics_reviewed: int
    chat_messages: int
    revenue_naira: int


class PlatformTractionResponse(BaseModel):
    period: str  # "weekly", "monthly", "yearly"
    current: TractionMetrics
    previous: TractionMetrics
    percent_changes: dict[str, float | None]
    breakdown_labels: list[str]
    breakdown_data: list[TractionMetrics]


class ClearActivityRequest(BaseModel):
    confirmation: str = Field(..., description="Must type 'CLEAR ACTIVITY' to confirm")
    clear_chat_messages: bool = True
    clear_topic_reviews: bool = True
    clear_daily_activity: bool = True
    clear_recall_queues: bool = True


class ClearActivityResponse(BaseModel):
    success: bool
    message: str
    deleted_counts: dict[str, int]


class FunnelStepItem(BaseModel):
    step: int
    name: str
    description: str
    count: int
    conversion_from_first: float
    conversion_from_previous: float


class SuperAdminFunnelResponse(BaseModel):
    total_students: int
    funnel: list[FunnelStepItem]


class ResetUserRequest(BaseModel):
    reset_session: bool = True
    clear_device_fingerprint: bool = True
    new_password: str | None = Field(default=None, min_length=8, max_length=128)
    force_password_change: bool = False


class ResetUserResponse(BaseModel):
    success: bool
    message: str
    temporary_password: str | None = None


class GenerateCodesRequest(BaseModel):
    type: str = Field(default="individual", pattern="^(individual|org)$")
    school_id: str | None = None
    count: int = Field(default=20, ge=1, le=500)
    prefix: str = Field(default="BETA", max_length=10)
    duration_months: int = Field(default=4, ge=1, le=24)


class GenerateCodesResponse(BaseModel):
    count: int
    type: str
    codes: list[str]


class AccessCodeItem(BaseModel):
    id: str
    code: str
    type: str
    status: str
    school_id: str | None = None
    school_name: str | None = None
    activated_by: str | None = None
    activated_by_username: str | None = None
    activated_at: datetime | None = None
    expires_at: datetime | None = None
    created_at: datetime


class AccessCodeListResponse(BaseModel):
    items: list[AccessCodeItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class UpdateUserRoleRequest(BaseModel):
    role: str = Field(pattern="^(student_individual|student_org|admin|super_admin)$")


class AuditLogItem(BaseModel):
    id: str
    actor_user_id: str | None = None
    actor_username: str
    action: str
    target_type: str | None = None
    target_id: str | None = None
    details: dict | None = None
    ip: str | None = None
    created_at: datetime


class AuditLogListResponse(BaseModel):
    items: list[AuditLogItem]
    total: int
    page: int
    page_size: int
    total_pages: int


# ── Super Admin Invite Schemas ─────────────────────────────────────────────


class SuperAdminInviteRequest(BaseModel):
    """Body for POST /super-admin/admins/invite."""

    email: EmailStr

    @field_validator("email", mode="before")
    @classmethod
    def normalise_email(cls, v: str) -> str:
        return v.strip().lower()


class SuperAdminInviteItem(BaseModel):
    """Single invite row returned by list and revoke endpoints."""

    id: str
    email: str
    status: str  # pending | accepted | revoked | expired (computed)
    invited_by_username: str | None = None
    created_at: datetime
    expires_at: datetime
    accepted_at: datetime | None = None
    is_expired: bool


class SuperAdminInviteListResponse(BaseModel):
    items: list[SuperAdminInviteItem]
    total: int


# ── Super Admin User Schemas ───────────────────────────────────────────────


class SuperAdminItem(BaseModel):
    """A current super admin as shown in the platform admin list."""

    id: str
    username: str
    email: str | None = None
    name: str | None = None
    created_at: datetime
    last_seen_at: datetime | None = None


class SuperAdminListResponse(BaseModel):
    items: list[SuperAdminItem]
    total: int


# ── Accept Invite Schema ───────────────────────────────────────────────────


class AcceptInviteRequest(BaseModel):
    """Body for POST /auth/super-admin/accept-invite (public endpoint)."""

    token: str = Field(
        min_length=43, max_length=44
    )  # urlsafe_b64 of 32 bytes ≈ 43 chars
    # Required only when creating a brand-new account (not when promoting an existing user).
    name: str | None = Field(default=None, min_length=1, max_length=255)
    username: str | None = Field(default=None, min_length=3, max_length=50)
    password: str | None = Field(default=None, min_length=8, max_length=128)
