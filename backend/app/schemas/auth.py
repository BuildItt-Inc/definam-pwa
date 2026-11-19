from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, model_validator


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=150)
    password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)
    access_code: str


class LoginRequest(BaseModel):
    username_or_email: str = Field(
        default="",
        max_length=150,
        description="Username or email address",
    )
    email: str | None = Field(
        default=None,
        max_length=150,
        description="Email address (alternative to username_or_email)",
    )
    password: str = Field(..., max_length=128)

    model_config = {"populate_by_name": True}

    @model_validator(mode="before")
    @classmethod
    def populate_username_or_email(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("username_or_email") and data.get("email"):
                data["username_or_email"] = data["email"]
            if not data.get("username_or_email"):
                raise ValueError("username_or_email or email is required")
        return data


class LoginResponse(BaseModel):
    """
    Body returned on successful login.
    refresh_token is NOT included — it is sent as an httpOnly cookie by the endpoint.
    """

    access_token: str
    role: str
    force_password_change: bool


class SuperAdminLoginResponse(BaseModel):
    """
    Body returned on successful super admin login.
    refresh_token is sent as an httpOnly cookie.
    Designed to support optional 2FA in the future without breaking changes.
    """

    access_token: str
    role: str = "super_admin"
    force_password_change: bool = False
    requires_2fa: bool = False
    temp_token: str | None = None


class OrgLoginRequest(BaseModel):
    access_code: str
    user_agent: str = "unknown"
    student_name: str | None = None


class OrgLoginResponse(BaseModel):
    """
    Body returned on successful org-student login.
    refresh_token is NOT included — it is sent as an httpOnly cookie by the endpoint.
    """

    access_token: str
    role: str


class RefreshResponse(BaseModel):
    """Body returned after a successful token refresh."""

    access_token: str
    role: str


class ChangePasswordRequest(BaseModel):
    old_password: str | None = Field(default=None, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)


class UserMeResponse(BaseModel):
    id: str
    username: str
    role: str
    org_id: str | None = None
    name: str | None = None
    email: str | None = None
