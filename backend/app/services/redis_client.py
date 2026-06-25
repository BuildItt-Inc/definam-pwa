import json

import redis

from app.core.config import get_settings

_redis_client = None


def get_redis():
    global _redis_client

    if _redis_client is None:
        settings = get_settings()
        url = settings.redis_url.strip()

        if not url:
            raise ValueError("REDIS_URL is not configured")

        _redis_client = redis.from_url(url, decode_responses=True, ssl_cert_reqs=None)

    return _redis_client


def set_topic_content(
    topic_id: str,
    content: dict,
    ttl: int = 604800,  # 7 days
):
    r = get_redis()
    key = f"topic:{topic_id}:steps_content"
    r.setex(key, ttl, json.dumps(content))


def get_topic_content(topic_id: str):
    r = get_redis()
    key = f"topic:{topic_id}:steps_content"

    data = r.get(key)

    if data:
        if isinstance(data, bytes):
            data = data.decode("utf-8")
        return json.loads(data)

    return None


def delete_topic_cache(topic_id: str):
    r = get_redis()
    key = f"topic:{topic_id}:steps_content"
    r.delete(key)
