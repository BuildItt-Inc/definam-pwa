import asyncio
import os
import sys
from datetime import date

import httpx
from sqlalchemy import delete, select

# Ensure backend root is in PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.security import create_jwt
from app.db.models import (
    AccessCode,
    Chapter,
    ChatDailyUsage,
    School,
    Subject,
    Topic,
    User,
)
from app.db.session import _get_session_factory
from app.main import app


async def run_chaos_test():
    print("[START] Starting Definam Chaos, Security, & Smoke Tests...")

    session_factory = _get_session_factory()

    # ── Test IDs & constants ───────────────────────────────────────────────
    SCHOOL_A_NAME = "Chaos School A"
    SCHOOL_B_NAME = "Chaos School B"

    # Clear any residual chaos data
    async with session_factory() as session:
        # Delete chat usage first to avoid FK constraints
        await session.execute(
            delete(ChatDailyUsage).where(
                ChatDailyUsage.user_id.in_(
                    select(User.id).where(User.username.like("chaos_%"))
                )
            )
        )
        await session.execute(delete(AccessCode).where(AccessCode.code.like("CHAOS-%")))
        await session.execute(delete(User).where(User.username.like("chaos_%")))
        await session.execute(delete(School).where(School.name.like("Chaos School %")))
        await session.commit()

    # Setup database with Schools, Users (Student A, OrgAdmin A, OrgAdmin B) and Access Codes
    async with session_factory() as session:
        # Create schools
        school_a = School(name=SCHOOL_A_NAME, email="admin@schoola.com", active_seats=5)
        school_b = School(name=SCHOOL_B_NAME, email="admin@schoolb.com", active_seats=5)
        session.add_all([school_a, school_b])
        await session.flush()

        # Access Codes
        code_a1 = AccessCode(
            code="CHAOS-SCHA-1111", type="org", status="pending", school_id=school_a.id
        )
        code_a2 = AccessCode(
            code="CHAOS-SCHA-2222", type="org", status="pending", school_id=school_a.id
        )
        code_b1 = AccessCode(
            code="CHAOS-SCHB-1111", type="org", status="pending", school_id=school_b.id
        )
        code_ind = AccessCode(
            code="CHAOS-INDV-9999", type="individual", status="pending"
        )
        session.add_all([code_a1, code_a2, code_b1, code_ind])

        # Users
        # OrgAdmin A (role: admin, belongs to School A)
        admin_a = User(
            username="chaos_admin_a",
            password_hash="dummy",
            role="admin",
            org_id=school_a.id,
        )
        # OrgAdmin B (role: admin, belongs to School B)
        admin_b = User(
            username="chaos_admin_b",
            password_hash="dummy",
            role="admin",
            org_id=school_b.id,
        )
        # Student A (role: student_org, registered under School A)
        student_a = User(
            username="chaos_student_a",
            password_hash="dummy",
            role="student_org",
            org_id=school_a.id,
        )
        session.add_all([admin_a, admin_b, student_a])
        await session.commit()

        # Save IDs for testing
        admin_a_id = admin_a.id
        admin_b_id = admin_b.id
        student_a_id = student_a.id
        school_a_id = school_a.id
        school_b_id = school_b.id
        code_a2_id = code_a2.id

    # Create stateless JWT tokens
    # Structure match: app/api/deps.py parses 'sub' (user_id), 'role', and 'org_id'
    token_student_a = create_jwt(
        student_a_id, {"role": "student_org", "org_id": school_a_id}
    )
    create_jwt(admin_a_id, {"role": "admin", "org_id": school_a_id})
    token_admin_b = create_jwt(admin_b_id, {"role": "admin", "org_id": school_b_id})

    # Prepare client
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as client:
        # =====================================================================
        # 1. SMOKE TESTS (Basic flow validation)
        # =====================================================================
        print("\n=== [1] Running Smoke Tests ===")

        # Healthcheck
        r = await client.get("/api/v1/health")
        assert r.status_code == 200, f"Healthcheck failed: {r.text}"
        print("[SUCCESS] Healthcheck response successful.")

        # Accessing subjects list (Student A)
        r = await client.get(
            "/api/v1/subjects", headers={"Authorization": f"Bearer {token_student_a}"}
        )
        assert r.status_code == 200, f"Subjects endpoint failed: {r.text}"
        print("[SUCCESS] Subjects endpoint returned list successfully.")

        # =====================================================================
        # 2. HACKER & SECURITY TESTS (Admin restrictions, BOLA/IDOR, Tampered JWTs)
        # =====================================================================
        print("\n=== [2] Running Hacker & Security Tests ===")

        # A. Privilege Escalation: Student tries to fetch admin access codes
        r = await client.get(
            "/api/v1/admin/codes/download",
            headers={"Authorization": f"Bearer {token_student_a}"},
        )
        assert r.status_code == 403, (
            f"Privilege Escalation failed! Student fetched admin codes: {r.text}"
        )
        print(
            "[SUCCESS] Correctly rejected: Standard student blocked from admin download endpoint."
        )

        # B. Privilege Escalation: Student tries to revoke a code
        r = await client.post(
            "/api/v1/admin/codes/revoke",
            json={"code_id": code_a2_id},
            headers={"Authorization": f"Bearer {token_student_a}"},
        )
        assert r.status_code == 403, (
            f"Privilege Escalation failed! Student revoked access code: {r.text}"
        )
        print(
            "[SUCCESS] Correctly rejected: Standard student blocked from admin revoke endpoint."
        )

        # C. BOLA (Broken Object Level Authorization): School B Admin tries to revoke School A's code
        # This checks that our school_id scopes work properly.
        r = await client.post(
            "/api/v1/admin/codes/revoke",
            json={"code_id": code_a2_id},
            headers={"Authorization": f"Bearer {token_admin_b}"},
        )
        assert r.status_code == 404, (
            f"BOLA vulnerability detected! School B Admin revoked School A code: {r.text}"
        )
        print(
            "[SUCCESS] Correctly rejected (404 Not Found): School B Admin cannot revoke School A's access code."
        )

        # D. SQL Injection / Malformed UUID in endpoints
        r = await client.post(
            "/api/v1/topics/12345-not-a-valid-uuid-injection-attempt/review",
            headers={"Authorization": f"Bearer {token_student_a}"},
        )
        assert r.status_code == 400, (
            f"Malformed UUID endpoint validation failed: {r.text}"
        )
        print("[SUCCESS] Correctly rejected: Malformed UUID format in path parameter.")

        # E. Invalid JWT Signature
        bad_token = token_student_a + "tampered"
        r = await client.get(
            "/api/v1/subjects", headers={"Authorization": f"Bearer {bad_token}"}
        )
        assert r.status_code == 401, f"Tampered token was accepted! {r.text}"
        print(
            "[SUCCESS] Correctly rejected: Tampered token verification signature failure."
        )

        # =====================================================================
        # 3. UNREASONABLE USER TESTS (Out of bounds inputs, rate limit spamming)
        # =====================================================================
        print("\n=== [3] Running Unreasonable User Tests ===")

        # Setup one topic for recall tests
        async with session_factory() as session:
            subj = Subject(name="Chaos Math", class_level="SS1")
            session.add(subj)
            await session.flush()
            chap = Chapter(subject_id=subj.id, chapter_num=1, title="Equations")
            session.add(chap)
            await session.flush()
            topic = Topic(
                chapter_id=chap.id, title="Simple Equations", status="published"
            )
            session.add(topic)
            await session.commit()
            topic_uuid = topic.id

        # A. Out-of-bounds rating: rating = 6 (Allowed range: 0-5)
        r = await client.post(
            f"/api/v1/topics/{topic_uuid}/recall",
            json={"rating": 6},
            headers={"Authorization": f"Bearer {token_student_a}"},
        )
        assert r.status_code == 400, f"Accepted invalid high rating: {r.text}"

        # B. Out-of-bounds rating: rating = -1
        r = await client.post(
            f"/api/v1/topics/{topic_uuid}/recall",
            json={"rating": -1},
            headers={"Authorization": f"Bearer {token_student_a}"},
        )
        assert r.status_code == 400, f"Accepted invalid negative rating: {r.text}"
        print(
            "[SUCCESS] Correctly rejected: Out-of-bound ratings returned 400 BadRequest."
        )

        # C. Rate Limiting: Abuse daily chat usage limit (Set count to 50 directly in database to test limit)
        async with session_factory() as session:
            usage = ChatDailyUsage(user_id=student_a_id, date=date.today(), count=50)
            session.add(usage)
            await session.commit()

        r = await client.get(
            f"/api/v1/chat/stream?topic_id={topic_uuid}&question=explain",
            headers={"Authorization": f"Bearer {token_student_a}"},
        )
        assert r.status_code == 429, f"Chat streaming rate limit failed: {r.text}"
        print(
            "[SUCCESS] Correctly rejected (429 Rate Limit Exceeded): Chat limits enforced at 50/day."
        )

    # ── Database Cleanup ───────────────────────────────────────────────────
    print("\n[INFO] Cleaning up test database records...")
    async with session_factory() as session:
        # Delete chat usage first to avoid FK constraints
        await session.execute(
            delete(ChatDailyUsage).where(
                ChatDailyUsage.user_id.in_(
                    select(User.id).where(User.username.like("chaos_%"))
                )
            )
        )
        # Remove created subject & dependencies (Topic -> Chapter -> Subject)
        # We delete by title/name to make sure everything is completely cleaned up.
        await session.execute(delete(Topic).where(Topic.title == "Simple Equations"))
        await session.execute(delete(Chapter).where(Chapter.title == "Equations"))
        await session.execute(delete(Subject).where(Subject.name == "Chaos Math"))
        await session.execute(delete(AccessCode).where(AccessCode.code.like("CHAOS-%")))
        await session.execute(delete(User).where(User.username.like("chaos_%")))
        await session.execute(delete(School).where(School.name.like("Chaos School %")))
        await session.commit()
    print("[INFO] Database cleaned successfully.")
    print("\n[SUCCESS] ALL CHAOS, SECURITY, & SMOKE TESTS PASSED!")


if __name__ == "__main__":
    asyncio.run(run_chaos_test())
