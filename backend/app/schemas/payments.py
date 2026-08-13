from __future__ import annotations

from pydantic import BaseModel, EmailStr, field_validator


class IndividualPaymentRequest(BaseModel):
    email: EmailStr
    terms: int = 1

    @field_validator("terms")
    @classmethod
    def validate_terms(cls, v: int) -> int:
        if v not in (1, 3):
            raise ValueError("Terms must be either 1 or 3.")
        return v


class IndividualPaymentResponse(BaseModel):
    authorization_url: str
    reference: str


class OrgPaymentRequest(BaseModel):
    school_email: EmailStr
    school_name: str
    student_count: int

    @field_validator("student_count")
    @classmethod
    def check_minimum_students(cls, v: int) -> int:
        MIN_STUDENTS = 10
        if v < MIN_STUDENTS:
            raise ValueError(
                f"An organization must pay for at least {MIN_STUDENTS} students at a time."
            )
        return v


class OrgPaymentResponse(BaseModel):
    authorization_url: str
    reference: str
    total_amount_naira: int
