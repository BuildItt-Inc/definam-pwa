"""Unit tests for the dashboard's new overall-completion calculation
(Part 1 of the dashboard/learning-interface redesign)."""
from __future__ import annotations

from app.api.v1.endpoints.students import _compute_completion_percent


def test_completion_percent_normal_case():
    assert _compute_completion_percent(topics_studied=127, total_topics=1277) == 10


def test_completion_percent_zero_studied():
    assert _compute_completion_percent(topics_studied=0, total_topics=1277) == 0


def test_completion_percent_all_studied():
    assert _compute_completion_percent(topics_studied=1277, total_topics=1277) == 100


def test_completion_percent_guards_against_division_by_zero():
    """An empty curriculum (total_topics == 0) must not raise."""
    assert _compute_completion_percent(topics_studied=0, total_topics=0) == 0


def test_completion_percent_rounds_to_nearest_int():
    # 1/3 = 33.33...% -> rounds to 33, not truncates to 33 by luck of the math
    assert _compute_completion_percent(topics_studied=1, total_topics=3) == 33
    # 2/3 = 66.66...% -> rounds to 67
    assert _compute_completion_percent(topics_studied=2, total_topics=3) == 67
