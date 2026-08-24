from __future__ import annotations

import json
import logging
import os
from datetime import UTC, datetime
from typing import Any

import firebase_admin
from firebase_admin import credentials, messaging
from sqlalchemy import delete, select, update

from app.db.database import db_session
from app.db.models import UserNotificationToken

logger = logging.getLogger(__name__)

# ── Initialize Firebase App ───────────────────────────────────────────────
firebase_initialized = False

try:
    if not firebase_admin._apps:
        cred_path = os.environ.get("FIREBASE_CREDENTIALS")
        cred_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")

        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            firebase_initialized = True
            logger.info("Firebase Admin SDK initialized from credentials file.")
        elif cred_json:
            try:
                parsed_json = json.loads(cred_json)
                cred = credentials.Certificate(parsed_json)
                firebase_admin.initialize_app(cred)
                firebase_initialized = True
                logger.info("Firebase Admin SDK initialized from JSON environment variable.")
            except Exception as json_err:
                logger.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: %s", json_err)
        else:
            # Fallback to default application credentials if available
            try:
                firebase_admin.initialize_app()
                firebase_initialized = True
                logger.info("Firebase Admin SDK initialized with Application Default Credentials.")
            except Exception:
                logger.warning(
                    "No valid Firebase credentials found. FCM running in DRY RUN (logging-only) mode."
                )
    else:
        firebase_initialized = True
except Exception as e:
    logger.error("Error during Firebase Admin SDK initialization: %s", e)


# ── FCM Operations ─────────────────────────────────────────────────────────


async def register_token(
    user_id: str, fcm_token: str, device_type: str | None = None
) -> None:
    """Store or update an FCM token for a user.

    Enforces uniqueness of the fcm_token.
    """
    async with db_session() as session:
        # Check if this token is already registered to anyone
        stmt = select(UserNotificationToken).where(
            UserNotificationToken.fcm_token == fcm_token
        )
        existing = (await session.execute(stmt)).scalar_one_or_none()

        now = datetime.now(tz=UTC)
        if existing:
            if existing.user_id == user_id:
                # Update last used timestamp
                await session.execute(
                    update(UserNotificationToken)
                    .where(UserNotificationToken.id == existing.id)
                    .values(last_used_at=now, device_type=device_type)
                )
            else:
                # Re-assign token to the new user (e.g. log out / log in as someone else)
                await session.execute(
                    update(UserNotificationToken)
                    .where(UserNotificationToken.id == existing.id)
                    .values(user_id=user_id, last_used_at=now, device_type=device_type)
                )
        else:
            # Create new token record
            new_token = UserNotificationToken(
                user_id=user_id,
                fcm_token=fcm_token,
                device_type=device_type,
                created_at=now,
                last_used_at=now,
            )
            session.add(new_token)

        await session.commit()
        logger.info("FCM token registered/updated for user %s.", user_id)


async def unregister_token(fcm_token: str) -> None:
    """Explicitly remove an FCM token from database (e.g. on logout)."""
    async with db_session() as session:
        await session.execute(
            delete(UserNotificationToken).where(
                UserNotificationToken.fcm_token == fcm_token
            )
        )
        await session.commit()
        logger.info("FCM token unregistered.")


async def send_multicast_fcm(
    user_ids: list[str],
    title: str,
    body: str,
    data: dict[str, str] | None = None,
) -> dict[str, Any]:
    """Send a push notification to all active devices of specified users.

    Cleans up any expired or unregistered tokens automatically.
    """
    if not user_ids:
        return {"status": "skipped", "reason": "no users"}

    # Fetch all tokens for these users
    async with db_session() as session:
        stmt = select(UserNotificationToken).where(
            UserNotificationToken.user_id.in_(user_ids)
        )
        tokens_result = (await session.execute(stmt)).scalars().all()

    if not tokens_result:
        logger.info("No registered FCM tokens found for users: %s", user_ids)
        return {"status": "skipped", "reason": "no registered devices"}

    # Group tokens for batching
    token_records = [
        {"id": r.id, "token": r.fcm_token, "user_id": r.user_id}
        for r in tokens_result
    ]
    tokens = [r["token"] for r in token_records]

    # FCM allows up to 500 tokens in a multicast message
    success_count = 0
    failure_count = 0
    tokens_to_remove: list[str] = []

    # Batch multicast sending in chunks of 500
    for i in range(0, len(tokens), 500):
        batch_tokens = tokens[i : i + 500]
        batch_records = token_records[i : i + 500]

        if not firebase_initialized:
            logger.info(
                "[DRY RUN FCM] Sending notification to %d devices: '%s' - '%s'",
                len(batch_tokens),
                title,
                body,
            )
            success_count += len(batch_tokens)
            continue

        try:
            # Prepare message
            message = messaging.MulticastMessage(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data=data or {},
                tokens=batch_tokens,
            )

            # Send multicast
            response = messaging.send_each_for_multicast(message)
            success_count += response.success_count
            failure_count += response.failure_count

            # Find invalid / unregistered tokens to purge them from database
            for index, response_item in enumerate(response.responses):
                if not response_item.success:
                    token = batch_tokens[index]
                    record_id = batch_records[index]["id"]
                    exc = response_item.exception
                    logger.warning(
                        "FCM send failed for token %s (record ID: %s): %s",
                        token[:15] + "...",
                        record_id,
                        exc,
                    )

                    # UnregisteredError means the token is no longer valid/expired
                    if isinstance(exc, messaging.UnregisteredError) or (
                        hasattr(exc, "code")
                        and exc.code
                        in [
                            "messaging/invalid-argument",
                            "messaging/registration-token-not-registered",
                        ]
                    ):
                        tokens_to_remove.append(token)

        except Exception as e:
            logger.error("Critical error during multicast FCM sending: %s", e)
            failure_count += len(batch_tokens)

    # Automatically purge expired / stale tokens from the database
    if tokens_to_remove:
        async with db_session() as session:
            await session.execute(
                delete(UserNotificationToken).where(
                    UserNotificationToken.fcm_token.in_(tokens_to_remove)
                )
            )
            await session.commit()
        logger.info("Automatically purged %d expired FCM tokens.", len(tokens_to_remove))

    return {
        "status": "completed",
        "success_count": success_count,
        "failure_count": failure_count,
        "purged_count": len(tokens_to_remove),
    }
