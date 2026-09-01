from __future__ import annotations

from app.services.subject_service import normalize_subject_name


def test_normalize_subject_name_aliases():
    assert normalize_subject_name("English") == "English Language"
    assert normalize_subject_name("English.pdf") == "English Language"
    assert normalize_subject_name("ENGLISH LANGUAGE") == "English Language"
    assert normalize_subject_name("math") == "Mathematics"
    assert normalize_subject_name("agric") == "Agricultural Science"
    assert normalize_subject_name("literature") == "Literature in English"
    assert normalize_subject_name("crs") == "Christian Religious Studies"
    assert normalize_subject_name("civic") == "Civic Education"


def test_normalize_subject_name_canonical_matching():
    assert normalize_subject_name("chemistry") == "Chemistry"
    assert normalize_subject_name("PHYSICS") == "Physics"
    assert normalize_subject_name("  economics  ") == "Economics"


def test_normalize_subject_name_existing_db_matching():
    existing = ["Computer Graphics", "Robotics & Automation"]
    assert normalize_subject_name("computer graphics", existing) == "Computer Graphics"
    assert (
        normalize_subject_name("robotics & automation", existing)
        == "Robotics & Automation"
    )
