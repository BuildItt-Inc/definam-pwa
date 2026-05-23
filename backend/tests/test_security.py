from __future__ import annotations

import re

import pytest

from app.core.security import (
    create_jwt,
    decode_jwt,
    fingerprint_device,
    generate_access_code,
    generate_temp_password,
    hash_password,
    verify_password,
)

# ── Password ───────────────────────────────────────────────────────────────


@pytest.mark.anyio
async def test_password_hash_and_verify() -> None:
    hashed = await hash_password("secret123")
    assert hashed != "secret123"
    assert await verify_password("secret123", hashed)
    assert not await verify_password("wrong", hashed)


# ── JWT ────────────────────────────────────────────────────────────────────


def test_jwt_round_trip(monkeypatch) -> None:
    import app.core.config as cfg

    monkeypatch.setattr(
        cfg,
        "get_settings",
        lambda: type(
            "S",
            (),
            {
                "jwt_secret": "test-secret",
                "jwt_algorithm": "HS256",
                "jwt_expire_minutes": 60,
            },
        )(),
    )

    token = create_jwt("user-123", {"role": "student_org"})
    claims = decode_jwt(token)
    assert claims["sub"] == "user-123"
    assert claims["role"] == "student_org"


def test_expired_jwt_raises(monkeypatch) -> None:
    import app.core.security as sec

    monkeypatch.setattr(
        sec,
        "get_settings",
        lambda: type(
            "S",
            (),
            {
                "jwt_secret": "test-secret",
                "jwt_algorithm": "HS256",
                "jwt_expire_minutes": -100,  # already expired
            },
        )(),
    )

    token = create_jwt("user-123")
    with pytest.raises(ValueError, match="Invalid or expired token"):
        decode_jwt(token)


# ── Access code generation ─────────────────────────────────────────────────

INDIVIDUAL_PATTERN = re.compile(r"^IND-[A-Z2-9]{4}-[A-Z2-9]{2}$")
ORG_PATTERN = re.compile(r"^DA-[A-Z2-9]{4}-[A-Z2-9]{2}$")
AMBIGUOUS = {"O", "0", "I", "1"}


def test_individual_code_format() -> None:
    for _ in range(50):
        code = generate_access_code("individual")
        assert INDIVIDUAL_PATTERN.match(code), f"Bad format: {code}"
        segments = code.replace("IND-", "")
        assert not any(c in AMBIGUOUS for c in segments), f"Ambiguous char in: {code}"


def test_org_code_format() -> None:
    for _ in range(50):
        code = generate_access_code("org")
        assert ORG_PATTERN.match(code), f"Bad format: {code}"


def test_codes_are_unique() -> None:
    codes = {generate_access_code("org") for _ in range(500)}
    assert len(codes) > 490  # should have very few collisions


# ── Temp password ──────────────────────────────────────────────────────────


def test_temp_password_length() -> None:
    pwd = generate_temp_password(12)
    assert len(pwd) == 12
    assert pwd.isalnum()


# ── Device fingerprint ─────────────────────────────────────────────────────


def test_fingerprint_is_deterministic() -> None:
    fp1 = fingerprint_device("Mozilla/5.0", "41.200.1.1")
    fp2 = fingerprint_device("Mozilla/5.0", "41.200.1.1")
    assert fp1 == fp2


def test_different_inputs_give_different_fingerprints() -> None:
    fp1 = fingerprint_device("Chrome", "1.2.3.4")
    fp2 = fingerprint_device("Firefox", "1.2.3.4")
    assert fp1 != fp2
