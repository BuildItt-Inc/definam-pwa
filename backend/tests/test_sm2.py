import pytest

from app.services.sm2 import sm2_calculate


def test_rating_0_resets():
    ef, interval, reps = sm2_calculate(0, 2.5, 5, 3)
    assert ef == 2.5
    assert interval == 1
    assert reps == 0


def test_rating_3_first_review():
    ef, interval, reps = sm2_calculate(3, 2.5, 0, 0)
    assert ef == pytest.approx(2.36, 0.01)
    assert interval == 1
    assert reps == 1


def test_rating_5_first_review():
    ef, interval, reps = sm2_calculate(5, 2.5, 0, 0)
    assert ef == pytest.approx(2.6, 0.01)
    assert interval == 1
    assert reps == 1


def test_rating_5_second_review():
    ef, interval, reps = sm2_calculate(5, 2.6, 1, 1)
    assert interval == 6
    assert reps == 2


def test_rating_5_third_review():
    ef, interval, reps = sm2_calculate(5, 2.6, 6, 2)
    assert interval == round(6 * 2.6)  # 16 days
    assert reps == 3


def test_ef_floor_guard():
    ef, interval, reps = sm2_calculate(3, 1.2, 10, 5)
    assert ef == 1.3  # should not go below 1.3
