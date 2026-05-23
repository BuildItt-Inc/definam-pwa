import asyncio
import os
import sys

# Ensure backend root is in PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import delete

from app.db.models import AccessCode, School, User
from app.db.session import _get_session_factory
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services import auth_service


async def run_smoke_test():
    print("🚀 Starting DefinAm Backend Smoke Test...")

    # 1. Establish session factory and clean any residue
    session_factory = _get_session_factory()

    async with session_factory() as session:
        print("🔗 Database connection verified.")
        # Ensure clean state for test run
        await session.execute(delete(AccessCode).where(AccessCode.code.like("SMOKE-%")))
        await session.execute(delete(User).where(User.username.like("smoke_%")))
        await session.execute(delete(School).where(School.name == "Smoke Test School"))
        await session.commit()

    try:
        # 2. Setup Test Access Code
        test_code = "SMOKE-IND-1234"
        async with session_factory() as session:
            # We insert an individual code directly
            new_code = AccessCode(code=test_code, type="individual", status="pending")
            session.add(new_code)
            await session.commit()
            print(f"✅ Setup individual access code: {test_code}")

        # 3. Test Registration
        register_req = RegisterRequest(
            username="smoke_student",
            password="SmokeSecurePass123!",
            confirm_password="SmokeSecurePass123!",
            access_code=test_code,
        )
        print("👤 Testing student registration...")
        reg_res = await auth_service.register(register_req)
        print(f"✅ Registration result: {reg_res}")

        # 4. Test Login & Token Hashing / Verification
        login_req = LoginRequest(
            username="smoke_student", password="SmokeSecurePass123!"
        )
        print("🔑 Testing student login...")
        login_res = await auth_service.login(login_req)
        print("✅ Login successful!")
        assert "access_token" in login_res, "Missing access_token"
        assert "refresh_token" in login_res, "Missing refresh_token"
        assert login_res["role"] == "student_individual", (
            f"Unexpected role: {login_res['role']}"
        )
        print(f"👉 Generated Access Token: {login_res['access_token'][:30]}...")
        print(f"👉 Generated Refresh Token: {login_res['refresh_token'][:30]}...")

        # 5. Test Token Refresh Lifecycle
        print("🔄 Testing refresh token rotation lifecycle...")
        refresh_res = await auth_service.refresh(login_res["refresh_token"])
        assert "access_token" in refresh_res, "Failed to refresh access_token"
        assert "refresh_token" in refresh_res, "Failed to rotate refresh_token"
        print("✅ Refresh and token rotation successful!")

        print(
            "\n🎉 SMOKE TEST COMPLETED SUCCESSFULLY! All components are fully operational."
        )

    finally:
        # 6. Database Cleanup
        print("🧹 Cleaning up smoke test database records...")
        async with session_factory() as session:
            await session.execute(
                delete(AccessCode).where(AccessCode.code.like("SMOKE-%"))
            )
            await session.execute(delete(User).where(User.username.like("smoke_%")))
            await session.execute(
                delete(School).where(School.name == "Smoke Test School")
            )
            await session.commit()
        print("✨ Database successfully cleaned.")


if __name__ == "__main__":
    asyncio.run(run_smoke_test())
