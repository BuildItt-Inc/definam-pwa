from __future__ import annotations

from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=150)
    password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)
    access_code: str


class LoginRequest(BaseModel):
    username_or_email: str = Field(
        ...,
        max_length=150,
        description="Username or email address",
    )
    password: str = Field(..., max_length=128)

    model_config = {"populate_by_name": True}


class LoginResponse(BaseModel):
    """
    Body returned on successful login.
    refresh_token is NOT included — it is sent as an httpOnly cookie by the endpoint.
    """

    access_token: str
    role: str
    force_password_change: bool


class OrgLoginRequest(BaseModel):
    access_code: str
    user_agent: str = "unknown"
    ip: str = "0.0.0.0"


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
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)


class UserMeResponse(BaseModel):
    id: str
    username: str
    role: str
    org_id: str | None = None
    name: str | None = None
    email: str | None = None
