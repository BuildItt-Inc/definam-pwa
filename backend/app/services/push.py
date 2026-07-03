import requests
from app.core.config import get_settings

settings = get_settings()

def send_daily_recall_push(user_id: str, topic_titles: list[str]) -> dict:
    """Send a push notification to a student about due topics."""
    if not topic_titles:
        return {"status": "skipped", "reason": "no topics"}

    message = f"You have {len(topic_titles)} topics to review today: " + ", ".join(topic_titles[:3])
    if len(topic_titles) > 3:
        message += f" and {len(topic_titles)-3} more."

    response = requests.post(
        "https://onesignal.com/api/v1/notifications",
        json={
            "app_id": settings.onesignal_app_id,
            "include_external_user_ids": [user_id],
            "contents": {"en": message},
            "headings": {"en": "📚 Daily Recall Reminder"},
            "data": {"type": "recall"},
        },
        headers={"Authorization": f"Basic {settings.onesignal_api_key}"}
    )
    response.raise_for_status()
    return response.json()