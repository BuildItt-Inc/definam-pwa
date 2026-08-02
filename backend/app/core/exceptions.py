# Custom domain exceptions for the DefinAm application.
# Raise these from services; the global handler converts them to HTTP responses.
from __future__ import annotations


class CustomDomainException(Exception):
    """
    Base exception for all domain-specific errors.

    Attributes:
        message (str): Human-readable error description.
        code (str): Machine-readable error code mapped to an HTTP status
                    via ERROR_STATUS_MAP in app.core.error_codes.
    """

    def __init__(self, message: str, code: str) -> None:
        self.message = message
        self.code = code
        super().__init__(message)


# ── Authentication & Authorization ─────────────────────────────────────────


class InvalidCredentialsError(CustomDomainException):
    """Raised when username or password is incorrect."""

    def __init__(self, message: str = "") -> None:
        super().__init__(
            message=message or "The username or password you entered is incorrect.",
            code="INVALID_CREDENTIALS",
        )


class InvalidTokenError(CustomDomainException):
    """Raised when a token is invalid or malformed."""

    def __init__(self, message: str = "") -> None:
        super().__init__(
            message=message or "Your session is invalid. Please log in again.",
            code="INVALID_TOKEN",
        )


class TokenExpiredError(CustomDomainException):
    """Raised when a JWT or session token has expired."""

    def __init__(self, message: str = "") -> None:
        super().__init__(
            message=message
            or "Your session has expired. Please log in again to continue.",
            code="TOKEN_EXPIRED",
        )


class AuthenticationError(CustomDomainException):
    """Raised when authentication fails for a general reason."""

    def __init__(self, message: str = "") -> None:
        super().__init__(
            message=message or "Authentication failed. Please try again.",
            code="AUTHENTICATION_ERROR",
        )


class ForbiddenError(CustomDomainException):
    """Raised when access to a resource is forbidden."""

    def __init__(self, message: str = "") -> None:
        super().__init__(
            message=message or "You do not have permission to access this resource.",
            code="FORBIDDEN",
        )


class PermissionDeniedError(CustomDomainException):
    """Raised when a user lacks a specific permission."""

    def __init__(self, message: str = "") -> None:
        super().__init__(
            message=message or "You do not have permission to perform this action.",
            code="PERMISSION_DENIED",
        )


class AccountInactiveError(CustomDomainException):
    """Raised when authenticating against a deactivated account."""

    def __init__(self, message: str = "") -> None:
        super().__init__(
            message=message
            or "Your account has been deactivated. Contact support for assistance.",
            code="ACCOUNT_INACTIVE",
        )


class AccountLockedError(CustomDomainException):
    """Raised when an account is locked after too many failed attempts."""

    def __init__(self, message: str = "") -> None:
        super().__init__(
            message=message
            or "Your account has been temporarily locked. Please try again later.",
            code="ACCOUNT_LOCKED",
        )


# ── Registration ───────────────────────────────────────────────────────────


class UserAlreadyRegisteredError(CustomDomainException):
    """Raised when attempting to register with a username/email already in use."""

    def __init__(self, message: str = "") -> None:
        super().__init__(
            message=message or "An account with this username already exists.",
            code="USER_ALREADY_REGISTERED",
        )


class RegistrationPendingError(CustomDomainException):
    """Raised when a pending registration already exists."""

    def __init__(self, message: str = "") -> None:
        super().__init__(
            message=message
            or "A pending registration already exists. Please check your inbox.",
            code="REGISTRATION_PENDING",
        )


class PasswordMismatchError(CustomDomainException):
    """Raised when password and confirm_password do not match."""

    def __init__(self, message: str = "") -> None:
        super().__init__(
            message=message or "Passwords do not match.",
            code="VALIDATION_ERROR",
        )


class PasswordReuseError(CustomDomainException):
    """Raised when a user attempts to reuse a previously used password."""

    def __init__(self, message: str = "") -> None:
        super().__init__(
            message=message
            or "New password cannot be the same as your current password.",
            code="PASSWORD_REUSE_ERROR",
        )


# ── Access Codes ───────────────────────────────────────────────────────────


class AccessCodeNotFoundError(CustomDomainException):
    """Raised when an access code does not exist in the database."""

    def __init__(self, message: str = "") -> None:
        super().__init__(
            message=message or "Access code not found.",
            code="NOT_FOUND",
        )


class AccessCodeWrongTypeError(CustomDomainException):
    """Raised when an access code is presented to the wrong auth path."""

    def __init__(self, expected: str = "", message: str = "") -> None:
        super().__init__(
            message=message or f"This code is not a valid {expected} access code.",
            code="BAD_REQUEST",
        )


class AccessCodeAlreadyUsedError(CustomDomainException):
    """Raised when an individual access code has already been activated."""

    def __init__(self, message: str = "") -> None:
        super().__init__(
            message=message or "This access code has already been used.",
            code="BAD_REQUEST",
        )


class AccessCodeRevokedError(CustomDomainException):
    """Raised when an org access code has been explicitly revoked."""

    def __init__(self, message: str = "") -> None:
        super().__init__(
            message=message or "This access code has been revoked.",
            code="FORBIDDEN",
        )


class AccessCodeExpiredError(CustomDomainException):
    """Raised when an access code has expired (lifespan of 4 months)."""

    def __init__(self, message: str = "") -> None:
        super().__init__(
            message=message or "This access code has expired. Please renew your subscription.",
            code="BAD_REQUEST",
        )


# ── Payments & Webhooks ────────────────────────────────────────────────────


class PaymentGatewayError(CustomDomainException):
    """Raised when the payment gateway (Paystack) returns an error."""

    def __init__(self, message: str = "") -> None:
        super().__init__(
            message=message or "Payment gateway error. Please try again.",
            code="GATEWAY_ERROR",
        )


class InvalidWebhookSignatureError(CustomDomainException):
    """Raised when a Paystack webhook HMAC signature check fails."""

    def __init__(self, message: str = "") -> None:
        super().__init__(
            message=message or "Invalid webhook signature.",
            code="INVALID_WEBHOOK_SIGNATURE",
        )


# ── General ────────────────────────────────────────────────────────────────


class NotFoundError(CustomDomainException):
    """Raised when a requested resource is not found."""

    def __init__(self, message: str = "") -> None:
        super().__init__(
            message=message or "The requested resource was not found.",
            code="NOT_FOUND",
        )


class AlreadyExistsError(CustomDomainException):
    """Raised when attempting to create a resource that already exists."""

    def __init__(self, message: str = "") -> None:
        super().__init__(
            message=message or "The resource already exists.",
            code="RESOURCE_EXISTS",
        )


class BadRequestError(CustomDomainException):
    """Raised when the request is invalid or malformed."""

    def __init__(self, message: str = "") -> None:
        super().__init__(
            message=message or "The request is invalid or malformed.",
            code="BAD_REQUEST",
        )


class ValidationError(CustomDomainException):
    """Raised when input validation fails."""

    def __init__(self, message: str = "") -> None:
        super().__init__(
            message=message
            or "Input validation failed. Please check your data and try again.",
            code="VALIDATION_ERROR",
        )


class ProcessingError(CustomDomainException):
    """Raised when processing fails due to an unexpected error."""

    def __init__(self, message: str = "") -> None:
        super().__init__(
            message=message
            or "Unable to process your request at this time. Please try again.",
            code="PROCESSING_ERROR",
        )


class RateLimitExceededError(CustomDomainException):
    """Raised when a rate limit is exceeded."""

    def __init__(self, message: str = "") -> None:
        super().__init__(
            message=message or "Too many requests. Please try again later.",
            code="RATE_LIMIT_EXCEEDED",
        )
