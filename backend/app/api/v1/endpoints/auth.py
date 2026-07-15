from __future__ import annotations

from fastapi import APIRouter, Cookie, HTTPException, Request, Response

from app.api.deps import BearerTokenDep, CurrentUserDep
from app.core.config import get_settings
from app.core.exceptions import InvalidTokenError
from app.core.limiter import limiter
from app.core.security import create_jwt
from app.db.database import get_user_by_id, get_user_by_username
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
    response.set_cookie(
        key=_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=True,  # required when samesite="none"
        samesite="none",  # must be 'none' for cross-origin (Vercel → Coolify)
        max_age=max_age,
        path="/",  # widened so both /refresh and /logout can receive the cookie
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(key=_COOKIE_NAME, path="/", samesite="none", secure=True)

@router.post("/register", status_code=201)
@limiter.limit("3/minute")
async def register(request: Request, body: RegisterRequest) -> dict:
    """Register a new individual student using a valid access code."""
    # Call the registration service
    await auth_service.register(body)
    
    # Fetch the newly created user by username
    user = await get_user_by_username(body.username)
    if not user:
        raise HTTPException(404, "User not found after registration")
    
    # Generate JWT – `create_jwt` expects `subject` (user ID) and optional `extra_claims`
    token = create_jwt(
        subject=user["id"],
        extra_claims={"role": user["role"]}
    )
    
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
