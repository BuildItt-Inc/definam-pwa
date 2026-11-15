from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime

from fastapi import HTTPException

from app.core.exceptions import (
    AccessCodeAlreadyUsedError,
    AccessCodeExpiredError,
    AccessCodeNotFoundError,
    AccessCodeRevokedError,
    AccessCodeWrongTypeError,
    BadRequestError,
    InvalidCredentialsError,
    InvalidTokenError,
    NotFoundError,
    PasswordMismatchError,
    UserAlreadyRegisteredError,
)
from app.core.security import (
    create_jwt,
    create_refresh_jwt,
    create_super_admin_jwt,
    create_super_admin_refresh_jwt,
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
    update_user_session_id,
)
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    OrgLoginRequest,
    RegisterRequest,
)
from app.services.redis_client import get_redis

logger = logging.getLogger(__name__)

_LOCKOUT_MAX_ATTEMPTS = 5
_LOCKOUT_WINDOW_SECONDS = 900  # 15 minutes
_local_sa_attempts: dict[str, list[float]] = {}


def check_super_admin_lockout(credential: str, ip: str | None = None) -> bool:
    """Returns True if NOT locked out (i.e. allowed to attempt), False if locked out."""
    now = datetime.now(tz=UTC).timestamp()
    try:
        r = get_redis()
        cred_fails = int(r.get(f"sa_fail_cred:{credential}") or 0)
        ip_fails = int(r.get(f"sa_fail_ip:{ip}") or 0) if ip else 0
        if cred_fails >= _LOCKOUT_MAX_ATTEMPTS or ip_fails >= _LOCKOUT_MAX_ATTEMPTS:
            return False
    except Exception:
        pass

    for key in [credential, ip]:
        if not key:
            continue
        valid = [
            t
            for t in _local_sa_attempts.get(key, [])
            if now - t < _LOCKOUT_WINDOW_SECONDS
        ]
        _local_sa_attempts[key] = valid
        if len(valid) >= _LOCKOUT_MAX_ATTEMPTS:
            return False

    return True


def record_super_admin_failure(credential: str, ip: str | None = None) -> None:
    now = datetime.now(tz=UTC).timestamp()
    for key in [credential, ip]:
        if not key:
            continue
        _local_sa_attempts.setdefault(key, []).append(now)

    try:
        r = get_redis()
        if credential:
            r.incr(f"sa_fail_cred:{credential}")
            r.expire(f"sa_fail_cred:{credential}", _LOCKOUT_WINDOW_SECONDS)
        if ip:
            r.incr(f"sa_fail_ip:{ip}")
            r.expire(f"sa_fail_ip:{ip}", _LOCKOUT_WINDOW_SECONDS)
    except Exception:
        pass


def clear_super_admin_lockout(credential: str, ip: str | None = None) -> None:
    _local_sa_attempts.pop(credential, None)
    if ip:
        _local_sa_attempts.pop(ip, None)

    try:
        r = get_redis()
        r.delete(f"sa_fail_cred:{credential}")
        if ip:
            r.delete(f"sa_fail_ip:{ip}")
    except Exception:
        pass


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

    # Super admin accounts must exclusively use /auth/super-admin/login
    if role == "super_admin":
        raise InvalidCredentialsError()

    session_id = str(uuid.uuid4())
    await update_user_session_id(user_id, session_id)

    extra_claims: dict = {"role": role, "session_id": session_id}
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


async def super_admin_login(body: LoginRequest, client_ip: str | None = None) -> dict:
    """
    Authenticate exclusively a super_admin user.
    Enforces per-IP and per-account lockout, verifies role from DB,
    and issues tokens with scope=super_admin.
    """
    credential = body.username_or_email.strip()
    if not check_super_admin_lockout(credential, client_ip):
        raise HTTPException(
            status_code=429,
            detail="Too many failed super admin login attempts. Account temporarily locked. Please try again later.",
        )

    user_row = await get_user_by_username(credential)
    if not user_row and "@" in credential:
        user_row = await get_user_by_email(credential.lower())

    if not user_row:
        record_super_admin_failure(credential, client_ip)
        raise InvalidCredentialsError()

    stored_hash = user_row.get("password_hash") or ""
    if not stored_hash or not await verify_password(body.password, stored_hash):
        record_super_admin_failure(credential, client_ip)
        raise InvalidCredentialsError()

    # Reject non-super-admin with exact same generic error (no account/role leakage)
    if user_row.get("role") != "super_admin":
        record_super_admin_failure(credential, client_ip)
        raise InvalidCredentialsError()

    clear_super_admin_lockout(credential, client_ip)

    user_id: str = user_row["id"]
    session_id = str(uuid.uuid4())
    await update_user_session_id(user_id, session_id)

    extra_claims = {"role": "super_admin", "session_id": session_id}
    access_token = create_super_admin_jwt(subject=user_id, extra_claims=extra_claims)
    refresh_token = create_super_admin_refresh_jwt(
        subject=user_id, extra_claims=extra_claims
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "role": "super_admin",
        "force_password_change": user_row.get("force_password_change", False),
        "user": user_row,
    }


async def org_login(body: OrgLoginRequest, client_ip: str = "0.0.0.0") -> dict:
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

    user_agent = body.user_agent if body.user_agent else "unknown"
    fingerprint = fingerprint_device(user_agent, client_ip)

    if code_row["status"] == "pending":
        user_id = str(uuid.uuid4())
        await create_student_user(
            user_id=user_id,
            org_id=code_row["school_id"],
            role="student_org",
            username=user_id,  # org students have no username — use ID
            name=body.student_name,  # store the student's actual name
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

    session_id = str(uuid.uuid4())
    await update_user_session_id(user_id, session_id)

    extra_claims = {
        "role": "student_org",
        "org_id": code_row["school_id"],
        "session_id": session_id,
    }
    access_token = create_jwt(subject=user_id, extra_claims=extra_claims)
    refresh_token = create_refresh_jwt(subject=user_id, extra_claims=extra_claims)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "role": "student_org",
    }


async def change_password(token: str, body: ChangePasswordRequest) -> dict:
    """Change user password.

    Requires old_password verification unless force_password_change is active
    (e.g., admin or user's first login with a temporary password).
    """
    if body.new_password != body.confirm_password:
        raise PasswordMismatchError()

    try:
        claims = decode_jwt(token)
    except ValueError as exc:
        raise InvalidTokenError() from exc

    user_id: str = claims["sub"]
    user_row = await get_user_by_id(user_id)
    if not user_row:
        raise NotFoundError("User not found.")

    stored_hash = user_row.get("password_hash")
    # If the user is NOT forced to change password and already has a password hash,
    # require and verify the old password.
    if not user_row.get("force_password_change") and stored_hash:
        if not body.old_password:
            raise BadRequestError("Current password is required.")
        if not await verify_password(body.old_password, stored_hash):
            raise InvalidCredentialsError("Current password is incorrect.")

    await update_user_password(user_id, await hash_password(body.new_password))
    await set_force_password_change(user_id, False)

    return {"message": "Password updated successfully"}


async def logout(user_id: str | None = None) -> dict:
    """
    Sign out: clear the current_session_id in the database to invalidate active tokens,
    then return standard success.
    """
    if user_id:
        await update_user_session_id(user_id, None)
    return {"status": "success"}


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

    # Super admin refresh tokens cannot be used on standard refresh
    if claims.get("scope") == "super_admin":
        raise InvalidTokenError("Invalid token scope for standard refresh")

    user_id: str = claims["sub"]
    jwt_session_id = claims.get("session_id")

    # Re-fetch role AND org_id from DB (not from the old token's claims) so
    # revoked/changed accounts, or an admin reassigned to a different
    # school, can't keep refreshing with stale authorization data.
    user_row = await get_user_by_id(user_id)
    if not user_row:
        raise InvalidTokenError("User no longer exists")

    db_session_id = user_row.get("current_session_id")
    if jwt_session_id and db_session_id and db_session_id != jwt_session_id:
        raise InvalidTokenError("Session expired or logged in elsewhere.")

    role = user_row["role"]
    # Normal refresh can never yield a super_admin token
    if role == "super_admin":
        raise InvalidTokenError("Super admin accounts must use super admin refresh")

    extra_claims: dict = {"role": role}
    # Keep the same session ID for the refreshed session
    if jwt_session_id:
        extra_claims["session_id"] = jwt_session_id
    elif db_session_id:
        extra_claims["session_id"] = db_session_id

    if user_row.get("org_id"):
        extra_claims["org_id"] = user_row["org_id"]

    new_access = create_jwt(subject=user_id, extra_claims=extra_claims)
    new_refresh = create_refresh_jwt(subject=user_id, extra_claims=extra_claims)

    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "role": role,
    }


async def super_admin_refresh(refresh_token: str) -> dict:
    """
    Refresh a super admin session with token rotation and 12-hour absolute lifetime enforcement.
    """
    if not refresh_token:
        raise InvalidTokenError("No refresh token provided")

    try:
        claims = decode_jwt(refresh_token)
    except ValueError as exc:
        raise InvalidTokenError("Invalid or expired refresh token") from exc

    if claims.get("type") != "refresh":
        raise InvalidTokenError("Invalid token type")

    if claims.get("scope") != "super_admin":
        raise InvalidTokenError("Invalid token scope")

    now_ts = int(datetime.now(tz=UTC).timestamp())
    orig_iat = claims.get("orig_iat") or claims.get("iat")
    if orig_iat and (now_ts - orig_iat > 12 * 3600):
        raise InvalidTokenError(
            "Super admin session expired (12-hour limit reached). Please log in again."
        )

    user_id: str = claims["sub"]
    jwt_session_id = claims.get("session_id")

    user_row = await get_user_by_id(user_id)
    if not user_row or user_row.get("role") != "super_admin":
        raise InvalidTokenError("Super admin access revoked or not found")

    db_session_id = user_row.get("current_session_id")
    if jwt_session_id and db_session_id and db_session_id != jwt_session_id:
        raise InvalidTokenError("Session expired or logged in elsewhere.")

    # Rotate session ID in database
    new_session_id = str(uuid.uuid4())
    await update_user_session_id(user_id, new_session_id)

    extra_claims = {"role": "super_admin", "session_id": new_session_id}
    new_access = create_super_admin_jwt(subject=user_id, extra_claims=extra_claims)
    new_refresh = create_super_admin_refresh_jwt(
        subject=user_id, extra_claims=extra_claims, orig_iat=orig_iat
    )

    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "role": "super_admin",
    }
