from __future__ import annotations

import base64
import logging
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

import aiosmtplib
import resend
from anyio import to_thread
from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# ── Template engine ────────────────────────────────────────────────────────

_TEMPLATE_DIR = Path(__file__).parent.parent / "templates" / "emails"

_jinja_env = Environment(
    loader=FileSystemLoader(str(_TEMPLATE_DIR)),
    autoescape=select_autoescape(["html"]),
)


def _render(template_name: str, **context: object) -> str:
    """Render a Jinja2 email template from the emails/ directory."""
    return _jinja_env.get_template(template_name).render(**context)


# ── Internal dispatchers ───────────────────────────────────────────────────


async def _send_via_resend(
    to: str,
    subject: str,
    html: str,
    attachments: list[dict] | None = None,
) -> None:
    """Send an email using the Resend API."""
    settings = get_settings()
    resend.api_key = settings.resend_api_key

    params: resend.Emails.SendParams = {
        "from": settings.from_email,
        "to": [to],
        "subject": subject,
        "html": html,
    }
    if attachments:
        formatted_attachments = []
        for att in attachments:
            formatted_attachments.append(
                {
                    "filename": att["filename"],
                    "content": base64.b64encode(att["content"]).decode("utf-8"),
                }
            )
        params["attachments"] = formatted_attachments  # type: ignore[typeddict-unknown-key]

    await to_thread.run_sync(resend.Emails.send, params)


async def _send_via_smtp(
    to: str,
    subject: str,
    html: str,
    attachments: list[dict] | None = None,
) -> None:
    """Send an email via SMTP using aiosmtplib (STARTTLS)."""
    settings = get_settings()

    msg = MIMEMultipart("mixed")
    msg["From"] = settings.from_email
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(html, "html"))

    if attachments:
        for att in attachments:
            part = MIMEApplication(att["content"], Name=att["filename"])
            part["Content-Disposition"] = f'attachment; filename="{att["filename"]}"'
            msg.attach(part)

    await aiosmtplib.send(
        msg,
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        username=settings.smtp_username,
        password=settings.smtp_password,
        start_tls=True,
    )


async def send_email(
    to: str,
    subject: str,
    html: str,
    attachments: list[dict] | None = None,
) -> None:
    """
    Dispatch an email using Resend as the primary provider.

    Falls back to SMTP automatically if the Resend API key is absent
    or the Resend API returns an error.

    Args:
        to: Recipient email address.
        subject: Email subject line.
        html: Rendered HTML body.
        attachments: Optional list of dicts with keys ``filename`` (str) and
                     ``content`` (bytes).
    """
    settings = get_settings()

    if settings.resend_api_key:
        try:
            await _send_via_resend(to, subject, html, attachments)
            return
        except Exception as exc:
            logger.warning("Resend failed (%s); falling back to SMTP.", exc)

    await _send_via_smtp(to, subject, html, attachments)


# ── Public helpers ─────────────────────────────────────────────────────────


async def send_individual_code(to: str, code: str) -> None:
    """
    Send an individual student their access code after payment.

    Args:
        to: Student email address.
        code: The generated individual access code (e.g. ``IND-XXXX-XX``).
    """
    settings = get_settings()
    register_url = f"{settings.frontend_url.rstrip('/')}/register?code={code}"
    login_url = f"{settings.frontend_url.rstrip('/')}/login"
    html = _render(
        "individual_code.html",
        code=code,
        register_url=register_url,
        login_url=login_url,
        frontend_url=settings.frontend_url.rstrip('/'),
    )
    await send_email(to, "Your Recall Access Code", html)


async def send_expiration_reminder(
    to: str,
    code: str,
    expires_at_str: str,
    renew_url: str,
) -> None:
    """
    Send a subscription expiration reminder 1 week prior to code expiration.
    """
    html = _render(
        "expiration_reminder.html",
        code=code,
        expires_at_str=expires_at_str,
        renew_url=renew_url,
        frontend_url=get_settings().frontend_url.rstrip('/'),
    )
    await send_email(
        to, "Your Recall Access Code Expires Soon (7 Days Remaining)", html
    )


async def send_org_admin_credentials(
    to: str,
    school_name: str,
    temp_password: str,
    login_url: str,
    codes_csv: bytes,
    seat_count: int,
) -> None:
    """
    Send the school admin their temporary credentials and access-code CSV.

    Args:
        to: Admin email address (also used as the login username).
        school_name: Display name of the school.
        temp_password: Temporary password generated during webhook processing.
        login_url: Full URL to the admin login page.
        codes_csv: Raw bytes of the CSV containing all student access codes.
        seat_count: The number of active seats/licenses.
    """
    html = _render(
        "org_admin_credentials.html",
        school_name=school_name,
        admin_email=to,
        temp_password=temp_password,
        login_url=login_url,
        seat_count=seat_count,
        frontend_url=get_settings().frontend_url.rstrip('/'),
    )
    attachment = {"filename": "recall_access_codes.csv", "content": codes_csv}
    await send_email(
        to,
        f"Recall Admin Access — {school_name}",
        html,
        attachments=[attachment],
    )


async def send_payment_receipt(to: str, amount_naira: int, description: str) -> None:
    """
    Send a payment receipt after a successful Paystack charge.

    Args:
        to: Payer email address.
        amount_naira: Amount paid in Naira (not kobo).
        description: Human-readable description of what was purchased.
    """
    settings = get_settings()
    formatted = f"₦{amount_naira:,}"
    html = _render(
        "payment_receipt.html",
        amount=formatted,
        description=description,
        frontend_url=settings.frontend_url.rstrip('/'),
    )
    await send_email(to, f"Recall Payment Receipt — {formatted}", html)
