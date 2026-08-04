from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime

from app.core.exceptions import (
    AccessCodeAlreadyUsedError,
    AccessCodeExpiredError,
    AccessCodeNotFoundError,
    AccessCodeRevokedError,
    AccessCodeWrongTypeError,
    InvalidCredentialsError,
    InvalidTokenError,
    PasswordMismatchError,
    UserAlreadyRegisteredError,
)
from app.core.security import (
    create_jwt,
    create_refresh_jwt,
    decode_jwt,
    fingerprint_device,
    hash_password,
    verify_password,
)
from app.db.database import (
    activate_code,
    create_student_user,
    get_access_code,
    get_user_by_email,
    get_user_by_id,
    get_user_by_username,
    revoke_and_reactivate_code,
    set_force_password_change,
    update_user_password,
)
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    OrgLoginRequest,
    RegisterRequest,
)

logger = logging.getLogger(__name__)


async def register(body: RegisterRequest) -> tuple[str, str]:
    """
    Validate an individual access code, create a user row with a bcrypt
    password hash, and activate the code.
    """
    if body.password != body.confirm_password:
        raise PasswordMismatchError()

    code_row = await get_access_code(body.access_code)
    if not code_row:
        raise AccessCodeNotFoundError()
    if code_row["type"] != "individual":
        raise AccessCodeWrongTypeError(expected="individual")
    if code_row["status"] != "pending":
        raise AccessCodeAlreadyUsedError()

    # Check lifespan / expiration
    if code_row.get("expires_at"):
        exp = code_row["expires_at"]
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=UTC)
        if exp < datetime.now(UTC):
            raise AccessCodeExpiredError()

    if await get_user_by_username(body.username):
        raise UserAlreadyRegisteredError()

    user_id = str(uuid.uuid4())

    # Retrieve email from the access code (will be None for old codes)
    email = code_row.get("email")

    await create_student_user(
        user_id=user_id,
        org_id=None,
        role="student_individual",
        username=body.username,
        password_hash=await hash_password(body.password),
        email=email,  # <-- pass email
    )
    await activate_code(code_row["id"], user_id)

    return user_id, "student_individual"


async def login(body: LoginRequest) -> dict:
    """
    Authenticate an individual student or admin via username or email + password.
    Returns access_token and refresh_token (caller sets cookie for refresh_token).
    """
    credential = body.username_or_email
    user_row = await get_user_by_username(credential)
    if not user_row and "@" in credential:
        user_row = await get_user_by_email(credential.lower())

    if not user_row:
        raise InvalidCredentialsError()

    stored_hash = user_row.get("password_hash") or ""
    if not stored_hash or not await verify_password(body.password, stored_hash):
        raise InvalidCredentialsError()

    user_id: str = user_row["id"]
    role: str = user_row["role"]

    extra_claims: dict = {"role": role}
    if user_row.get("org_id"):
        extra_claims["org_id"] = user_row["org_id"]

    access_token = create_jwt(subject=user_id, extra_claims=extra_claims)
    refresh_token = create_refresh_jwt(subject=user_id, extra_claims=extra_claims)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "role": role,
        "force_password_change": user_row.get("force_password_change", False),
    }


async def org_login(body: OrgLoginRequest) -> dict:
    """
    Authenticate an org student by access code only.
    First use: creates the user record. Subsequent uses: validates device fingerprint.
    New device: revokes old fingerprint and issues a fresh JWT pair.
    """
    code_row = await get_access_code(body.access_code)
    if not code_row:
        raise AccessCodeNotFoundError()
    if code_row["type"] != "org":
        raise AccessCodeWrongTypeError(expected="org")

    # Check lifespan / expiration
    if code_row.get("expires_at"):
        exp = code_row["expires_at"]
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=UTC)
        if exp < datetime.now(UTC):
            raise AccessCodeExpiredError()

    fingerprint = fingerprint_device(body.user_agent, body.ip)

    if code_row["status"] == "pending":
        user_id = str(uuid.uuid4())
        await create_student_user(
            user_id=user_id,
            org_id=code_row["school_id"],
            role="student_org",
            username=user_id,  # org students have no username — use ID
            device_fingerprint=fingerprint,
        )
        await activate_code(code_row["id"], user_id, fingerprint)

    elif code_row["status"] == "active":
        user_id = code_row["activated_by"]
        stored_fp = code_row.get("device_fingerprint")

        if stored_fp and stored_fp != fingerprint:
            logger.info(
                "New device for code %s — revoking old fingerprint.", body.access_code
            )
            await revoke_and_reactivate_code(code_row["id"], fingerprint)
    else:
        raise AccessCodeRevokedError()

    extra_claims = {"role": "student_org", "org_id": code_row["school_id"]}
    access_token = create_jwt(subject=user_id, extra_claims=extra_claims)
    refresh_token = create_refresh_jwt(subject=user_id, extra_claims=extra_claims)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "role": "student_org",
    }


async def change_password(token: str, body: ChangePasswordRequest) -> dict:
    """
    Change password for an admin on first login.
    Clears the force_password_change flag after success.
    """
    if body.new_password != body.confirm_password:
        raise PasswordMismatchError()

    try:
        claims = decode_jwt(token)
    except ValueError as exc:
        raise InvalidTokenError() from exc

    user_id: str = claims["sub"]
    await update_user_password(user_id, await hash_password(body.new_password))
    await set_force_password_change(user_id, False)

    return {"message": "Password updated successfully"}


async def logout() -> dict:
    """
    Both token types are stateless JWTs — the client discards them.
    The refresh-token cookie is cleared by the endpoint directly.
    """
    return {"message": "Logged out"}


async def refresh(refresh_token: str) -> dict:
    """
    Refresh tokens.
    All tokens (individual, org, admin) are now custom JWTs, so one code path suffices.
    """
    if not refresh_token:
        raise InvalidTokenError("No refresh token provided")

    try:
        claims = decode_jwt(refresh_token)
    except ValueError as exc:
        raise InvalidTokenError("Invalid or expired refresh token") from exc

    if claims.get("type") != "refresh":
        raise InvalidTokenError("Invalid token type")

    user_id: str = claims["sub"]

    # Re-fetch role AND org_id from DB (not from the old token's claims) so
    # revoked/changed accounts, or an admin reassigned to a different
    # school, can't keep refreshing with stale authorization data.
    user_row = await get_user_by_id(user_id)
    if not user_row:
        raise InvalidTokenError("User no longer exists")
    role = user_row["role"]

    extra_claims: dict = {"role": role}
    if user_row.get("org_id"):
        extra_claims["org_id"] = user_row["org_id"]

    new_access = create_jwt(subject=user_id, extra_claims=extra_claims)
    new_refresh = create_refresh_jwt(subject=user_id, extra_claims=extra_claims)

    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "role": role,
    }
