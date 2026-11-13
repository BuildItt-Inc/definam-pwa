from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


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
