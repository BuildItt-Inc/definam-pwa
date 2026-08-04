"""
DefinAm Load Test — Locust script.
Simulates 100+ concurrent students hitting the API.

Run against staging (never production):
    locust -f tests/locustfile.py --headless -u 100 -r 10 -t 60s --host http://your-staging-host

Minimum pass targets:
    - 100+ concurrent users, 0% error rate on auth & recall endpoints
    - Avg response time < 500ms for all endpoints
    - Topic content must be served from Redis cache under load
"""

from __future__ import annotations

import random

from locust import HttpUser, between, task

# ── Helpers ────────────────────────────────────────────────────────────────

# Pool of test credentials seeded by tests/create_test_user.py or similar.
# Adjust these to match the users in your staging database.
TEST_USERS = [
    {"username_or_email": f"loadtest_user_{i}", "password": "Test12345"}
    for i in range(1, 101)  # loadtest_user_1 … loadtest_user_100
]

# A known published topic UUID in staging — update before running.
STAGING_TOPIC_ID = "00000000-0000-0000-0000-000000000001"


# ── User behaviour ──────────────────────────────────────────────────────────


class StudentUser(HttpUser):
    """Simulates a single student session."""

    wait_time = between(0.5, 2)  # realistic think-time between requests
    token: str | None = None
    topic_id: str = STAGING_TOPIC_ID

    def on_start(self) -> None:
        """Authenticate once per simulated user and store the JWT."""
        creds = random.choice(TEST_USERS)
        with self.client.post(
            "/api/v1/auth/login",
            json=creds,
            catch_response=True,
            name="POST /auth/login",
        ) as resp:
            if resp.status_code == 200:
                data = resp.json()
                self.token = data.get("access_token")
                resp.success()
            else:
                resp.failure(f"Login failed: {resp.status_code} {resp.text[:120]}")
                self.token = None

    def _auth_headers(self) -> dict:
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    @task(3)
    def get_recall_queue(self) -> None:
        """GET /api/v1/recall/queue — high-frequency, should always hit Redis cache."""
        with self.client.get(
            "/api/v1/recall/queue",
            headers=self._auth_headers(),
            catch_response=True,
            name="GET /recall/queue",
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            elif resp.status_code == 401:
                resp.failure("Unauthenticated — token missing or expired")
            else:
                resp.failure(f"Unexpected {resp.status_code}")

    @task(2)
    def get_topic(self) -> None:
        """GET /api/v1/topics/:id — content served from DB (or Redis in future)."""
        with self.client.get(
            f"/api/v1/topics/{self.topic_id}",
            headers=self._auth_headers(),
            catch_response=True,
            name="GET /topics/:id",
        ) as resp:
            if resp.status_code in (200, 404):
                resp.success()
            elif resp.status_code == 401:
                resp.failure("Unauthenticated")
            else:
                resp.failure(f"Unexpected {resp.status_code}")

    @task(1)
    def submit_recall(self) -> None:
        """POST /api/v1/topics/:id/recall — SM-2 update, writes to DB."""
        rating = random.randint(2, 5)  # realistic: mostly 2-5
        with self.client.post(
            f"/api/v1/topics/{self.topic_id}/recall",
            json={"rating": rating},
            headers=self._auth_headers(),
            catch_response=True,
            name="POST /topics/:id/recall",
        ) as resp:
            if resp.status_code in (200, 404):
                resp.success()
            elif resp.status_code == 401:
                resp.failure("Unauthenticated")
            else:
                resp.failure(f"Unexpected {resp.status_code}")

    @task(1)
    def get_heatmap(self) -> None:
        """GET /api/v1/students/me/heatmap — 90-day activity data."""
        with self.client.get(
            "/api/v1/students/me/heatmap",
            headers=self._auth_headers(),
            catch_response=True,
            name="GET /students/me/heatmap",
        ) as resp:
            if resp.status_code == 200:
                data = resp.json()
                if len(data) != 90:
                    resp.failure(f"Expected 90 heatmap entries, got {len(data)}")
                else:
                    resp.success()
            elif resp.status_code == 401:
                resp.failure("Unauthenticated")
            else:
                resp.failure(f"Unexpected {resp.status_code}")
