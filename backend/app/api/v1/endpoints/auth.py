from __future__ import annotations

import hashlib
import os
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Cookie, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr

from app.api.deps import BearerTokenDep, CurrentUserDep
from app.core.config import get_settings
from app.core.exceptions import BadRequestError, InvalidTokenError
from app.core.limiter import limiter
from app.core.security import create_jwt, create_refresh_jwt, hash_password
from app.db.database import (
    consume_password_reset_token,
    create_password_reset_token,
    get_user_by_email,
    get_user_by_id,
    get_user_by_username,
    update_user_password,
)
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    LoginResponse,
    OrgLoginRequest,
    OrgLoginResponse,
    RefreshResponse,
    RegisterRequest,
    UserMeResponse,
)
from app.services import auth_service

router = APIRouter()

_COOKIE_NAME = "refresh_token"


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    """Attach the refresh token as a Secure, HttpOnly, SameSite=None cookie.

    SameSite=None is required because the frontend (Vercel) and backend
    (Coolify) are on different origins. SameSite=Strict silently blocks the
    cookie from being sent on cross-origin requests, breaking token refresh.
    SameSite=None + Secure=True is the correct pairing for cross-origin cookies.
    """
    settings = get_settings()
    max_age = settings.jwt_refresh_expire_days * 24 * 60 * 60  # seconds
    
    is_secure = settings.frontend_url.startswith("https://")
    samesite_val = "none" if is_secure else "lax"

    response.set_cookie(
        key=_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=is_secure,
        samesite=samesite_val,
        max_age=max_age,
        path="/",  # widened so both /refresh and /logout can receive the cookie
    )


def _clear_refresh_cookie(response: Response) -> None:
    settings = get_settings()
    is_secure = settings.frontend_url.startswith("https://")
    samesite_val = "none" if is_secure else "lax"
    response.delete_cookie(
        key=_COOKIE_NAME,
        path="/",
        samesite=samesite_val,
        secure=is_secure,
    )


@router.post("/register", status_code=201)
@limiter.limit("3/minute")
async def register(request: Request, body: RegisterRequest, response: Response) -> dict:
    """Register a new individual student using a valid access code."""
    # Call the registration service
    await auth_service.register(body)
    
    # Fetch the newly created user by username
    user = await get_user_by_username(body.username)
    if not user:
        raise HTTPException(404, "User not found after registration")
    
    # Generate JWTs
    token = create_jwt(
        subject=user["id"],
        extra_claims={"role": user["role"]}
    )
    refresh_token = create_refresh_jwt(
        subject=user["id"],
        extra_claims={"role": user["role"]}
    )
    _set_refresh_cookie(response, refresh_token)
    
    return {
        "access_token": token,
        "role": user["role"],
        "force_password_change": False
    }


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Login (Individual Students & Admins)",
    description=(
        "Authenticate an individual student or school admin using their username "
        "and password. Returns an access token in the body and sets the refresh "
        "token as an HttpOnly cookie."
    ),
)
@limiter.limit("5/minute")
async def login(
    request: Request, body: LoginRequest, response: Response
) -> LoginResponse:
    """Authenticate an individual student or admin; set refresh-token cookie."""
    result = await auth_service.login(body)
    _set_refresh_cookie(response, result["refresh_token"])
    return LoginResponse(
        access_token=result["access_token"],
        role=result["role"],
        force_password_change=result["force_password_change"],
    )


@router.post(
    "/org-login",
    response_model=OrgLoginResponse,
    summary="Login (Organisational Students)",
    description=(
        "Authenticate an organisational student using their access code. "
        "The system tracks the device via IP and User-Agent. "
        "Returns an access token in the body and sets the refresh token as an HttpOnly cookie."
    ),
)
@limiter.limit("5/minute")
async def org_login(
    request: Request, body: OrgLoginRequest, response: Response
) -> OrgLoginResponse:
    """Authenticate an org student by access code; set refresh-token cookie."""
    result = await auth_service.org_login(body)
    _set_refresh_cookie(response, result["refresh_token"])
    return OrgLoginResponse(
        access_token=result["access_token"],
        role=result["role"],
    )


@router.post(
    "/refresh",
    response_model=RefreshResponse,
    summary="Refresh Access Token",
    description=(
        "Exchange a valid refresh-token cookie for a new access token. "
        "The refresh token is rotated on every successful call."
    ),
)
@limiter.limit("10/minute")
async def refresh_tokens(
    request: Request,
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=_COOKIE_NAME),
) -> RefreshResponse:
    """Read the refresh cookie, issue a new access + refresh token pair."""
    if not refresh_token:
        raise InvalidTokenError("No refresh token cookie found.")

    result = await auth_service.refresh(refresh_token)
    # Rotate the refresh token cookie
    _set_refresh_cookie(response, result["refresh_token"])
    return RefreshResponse(
        access_token=result["access_token"],
        role=result["role"],
    )


@router.post("/change-password")
@limiter.limit("3/minute")
async def change_password(
    request: Request,
    body: ChangePasswordRequest,
    token: BearerTokenDep,
) -> dict:
    """Change the authenticated user's password and clear the force-change flag."""
    return await auth_service.change_password(token, body)


@router.post(
    "/logout",
    summary="Logout",
    description="Clear the refresh-token cookie. The client must also discard the access token.",
)
async def logout(response: Response) -> dict:
    """Sign out: clear the refresh-token cookie."""
    _clear_refresh_cookie(response)
    return await auth_service.logout()


@router.get(
    "/me",
    response_model=UserMeResponse,
    summary="Get Current User Details",
    description="Return detailed profile information for the currently authenticated user.",
)
async def get_me(current_user: CurrentUserDep) -> UserMeResponse:
    """Fetch the fresh profile details for the currently logged-in user."""
    user = await get_user_by_id(current_user["sub"])
    if not user:
        raise InvalidTokenError("User record not found.")
    return UserMeResponse(
        id=user["id"],
        username=user["username"],
        role=user["role"],
        org_id=user["org_id"],
    )


# ── Forgot / Reset Password ────────────────────────────────────────────


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(request: Request, body: ForgotPasswordRequest) -> dict:
    """
    Send a password-reset email to an individual student.
    Always returns 200 (even if no account exists) to avoid email enumeration.
    """
    settings = get_settings()
    user = await get_user_by_email(str(body.email))

    if user and user.get("role") == "student_individual":
        raw_token = os.urandom(32).hex()
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        expires_at = datetime.now(UTC) + timedelta(hours=1)
        await create_password_reset_token(
            user_id=user["id"],
            token_hash=token_hash,
            expires_at=expires_at,
        )
        reset_url = (
            f"{settings.frontend_url.rstrip('/')}/auth/reset-password?token={raw_token}"
        )
        # Send email via Resend
        try:
            import httpx

            async with httpx.AsyncClient() as client:
                await client.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {settings.resend_api_key}"},
                    json={
                        "from": settings.from_email,
                        "to": [str(body.email)],
                        "subject": "Reset your Definam password",
                        "html": (
                            f"<p>Hi {user.get('name') or user.get('username')},</p>"
                            f"<p>Click the link below to reset your password. "
                            f"It expires in 1 hour.</p>"
                            f'<p><a href="{reset_url}">{reset_url}</a></p>'
                            f"<p>If you didn't request this, you can safely ignore this email.</p>"
                        ),
                    },
                    timeout=10,
                )
        except Exception:  # noqa: BLE001 — best-effort email
            pass

    return {"message": "If an account exists for that email, a reset link has been sent."}


@router.post("/reset-password")
@limiter.limit("5/minute")
async def reset_password(request: Request, body: ResetPasswordRequest) -> dict:
    """Consume a single-use reset token and update the user's password."""
    if len(body.new_password) < 8:
        raise BadRequestError("Password must be at least 8 characters.")

    token_hash = hashlib.sha256(body.token.encode()).hexdigest()
    record = await consume_password_reset_token(token_hash)
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    new_hash = await hash_password(body.new_password)
    await update_user_password(record["user_id"], new_hash)
    return {"message": "Password updated successfully."}

