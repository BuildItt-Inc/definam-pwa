"""Subject service providing normalization, canonical matching, and deduplication logic."""

from __future__ import annotations

import re

# Canonical WAEC subject list
CANONICAL_SUBJECTS = [
    "Mathematics",
    "English Language",
    "Chemistry",
    "Physics",
    "Economics",
    "Biology",
    "Literature in English",
    "Government",
    "Civic Education",
    "Christian Religious Studies",
    "Geography",
    "Financial Accounting",
    "Agricultural Science",
    "Fishery",
    "Food and Nutrition",
    "Computer Studies",
    "Marketing",
    "Commerce",
    "Further Mathematics",
    "Animal Husbandry",
    "Technical Drawing",
    "Office Practice",
]

# Explicit alias map for common shorthand / alternate names (lowercase key -> canonical value)
SUBJECT_ALIASES: dict[str, str] = {
    "english": "English Language",
    "english lang": "English Language",
    "english language": "English Language",
    "literature": "Literature in English",
    "lit in eng": "Literature in English",
    "literature in english": "Literature in English",
    "math": "Mathematics",
    "maths": "Mathematics",
    "mathematics": "Mathematics",
    "agric": "Agricultural Science",
    "agric science": "Agricultural Science",
    "agricultural science": "Agricultural Science",
    "crs": "Christian Religious Studies",
    "christian religious knowledge": "Christian Religious Studies",
    "christian religious studies": "Christian Religious Studies",
    "civic": "Civic Education",
    "civic education": "Civic Education",
    "further math": "Further Mathematics",
    "further maths": "Further Mathematics",
    "further mathematics": "Further Mathematics",
    "computer": "Computer Studies",
    "computer study": "Computer Studies",
    "computer studies": "Computer Studies",
    "food & nutrition": "Food and Nutrition",
    "food and nutrition": "Food and Nutrition",
    "financial account": "Financial Accounting",
    "financial accounting": "Financial Accounting",
    "tech drawing": "Technical Drawing",
    "technical drawing": "Technical Drawing",
}


def normalize_subject_name(
    raw_name: str, existing_names: list[str] | None = None
) -> str:
    """Normalize a subject name string to match canonical values or existing DB subjects.

    - Trims whitespace and strips extra interior spaces.
    - Strips '.pdf' or common filename suffixes if present.
    - Checks explicit alias map (e.g. 'English' -> 'English Language').
    - Performs case-insensitive matching against canonical WAEC subjects.
    - Performs case-insensitive matching against existing_names from DB.
    """
    if not raw_name:
        return "Unknown"

    cleaned = raw_name.strip()
    cleaned = re.sub(r"\.pdf$", "", cleaned, flags=re.IGNORECASE).strip()
    # Replace multiple whitespace characters with a single space
    cleaned = re.sub(r"\s+", " ", cleaned)

    if not cleaned:
        return "Unknown"

    lower_cleaned = cleaned.lower()

    # 1. Check explicit alias map
    if lower_cleaned in SUBJECT_ALIASES:
        return SUBJECT_ALIASES[lower_cleaned]

    # 2. Case-insensitive match against canonical subjects list
    for canonical in CANONICAL_SUBJECTS:
        if canonical.lower() == lower_cleaned:
            return canonical

    # 3. Case-insensitive match against existing DB subjects list
    if existing_names:
        for existing in existing_names:
            if existing.lower() == lower_cleaned:
                return existing

    # 4. Return title-cased cleaned name if no exact match
    return cleaned.title()
