# Global FastAPI exception handlers.
# Register via register_exception_handlers(app) in main.py.
from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.error_codes import ERROR_STATUS_MAP
from app.core.exceptions import CustomDomainException

logger = logging.getLogger(__name__)

_FALLBACK_STATUS = 500


async def domain_exception_handler(
    request: Request,
    exc: CustomDomainException,
) -> JSONResponse:
    """
    Convert any CustomDomainException into a structured JSON response.

    The HTTP status code is resolved from ERROR_STATUS_MAP using exc.code.
    Errors that map to 5xx are additionally logged at ERROR level.
    """
    status_code = ERROR_STATUS_MAP.get(exc.code, _FALLBACK_STATUS)

    if status_code >= 500:
        logger.error(
            "Domain error [%s] on %s %s: %s",
            exc.code,
            request.method,
            request.url.path,
            exc.message,
        )

    return JSONResponse(
        status_code=status_code,
        content={"detail": exc.message, "code": exc.code},
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Catch-all handler for any exception not matched by a more specific handler.

    Logs a full traceback at EXCEPTION level and returns a generic 500 response
    to avoid leaking internal details to the client.
    """
    logger.exception(
        "Unhandled exception on %s %s",
        request.method,
        request.url.path,
    )
    return JSONResponse(
        status_code=_FALLBACK_STATUS,
        content={
            "detail": "An unexpected error occurred. Please try again later.",
            "code": "INTERNAL_SERVER_ERROR",
        },
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Register all exception handlers on the FastAPI app instance."""
    app.add_exception_handler(CustomDomainException, domain_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, unhandled_exception_handler)
