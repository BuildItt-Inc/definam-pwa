import json

import redis

from app.core.config import get_settings

_settings = get_settings()
_redis_client = None


def get_redis():
    global _redis_client
    if _redis_client is None:
        url = _settings.redis_url.strip()
        if not url:
            raise ValueError("REDIS_URL is not set in environment")
        _redis_client = redis.from_url(
            url,
            decode_responses=True,
            socket_timeout=2.0,
            socket_connect_timeout=2.0,
            # If SSL errors persist, uncomment:
            # ssl_cert_reqs=None
        )
    return _redis_client


def set_topic_content(topic_id: str, content: dict, ttl: int = 604800):
    r = get_redis()
    key = f"topic:{topic_id}:steps_content"
    r.setex(key, ttl, json.dumps(content))


def get_topic_content(topic_id: str):
    r = get_redis()
    key = f"topic:{topic_id}:steps_content"
    data = r.get(key)
    if data:
        return json.loads(data)
    return None


def delete_topic_cache(topic_id: str):
    r = get_redis()
    key = f"topic:{topic_id}:steps_content"
    r.delete(key)
