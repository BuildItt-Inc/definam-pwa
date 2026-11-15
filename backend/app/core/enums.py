from __future__ import annotations

from enum import StrEnum


class InviteStatus(StrEnum):
    """Status of a super admin invite.

    ``expired`` is a computed display state derived from ``expires_at``; the
    stored status column only holds pending / accepted / revoked.
    """

    PENDING = "pending"
    ACCEPTED = "accepted"
    REVOKED = "revoked"
    EXPIRED = "expired"  # computed — never written to DB


class AuditAction(StrEnum):
    # User management
    USER_DELETE = "user.delete"
    USER_RESET = "user.reset"
    USER_ROLE_CHANGE = "user.role_change"

    # Access codes
    CODE_GENERATE = "code.generate"
    CODE_REVOKE = "code.revoke"
    CODE_REACTIVATE = "code.reactivate"

    # Super admin lifecycle
    SUPERADMIN_INVITE = "superadmin.invite"
    SUPERADMIN_INVITE_REVOKE = "superadmin.invite_revoke"
    SUPERADMIN_INVITE_ACCEPT = "superadmin.invite_accept"
    SUPERADMIN_REMOVE = "superadmin.remove"

    # Platform content
    TOPIC_APPROVE = "topic.approve"
    TOPIC_PUBLISH = "topic.publish"

    # Feature flags
    FEATURE_GLOBAL_UPDATE = "feature.global_update"
    FEATURE_SCHOOL_OVERRIDE = "feature.school_override"

    # Super admin authentication
    AUTH_SUPER_ADMIN_LOGIN = "auth.super_admin_login"
    AUTH_SUPER_ADMIN_LOGIN_FAILED = "auth.super_admin_login_failed"
