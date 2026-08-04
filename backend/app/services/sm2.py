def sm2_calculate(rating: int, ease_factor: float, interval: int, repetitions: int):
    """
    Calculate new SM-2 values based on student rating.

    Args:
        rating: 0-5 (0 = forgot, 5 = perfect)
        ease_factor: current EF (1.3-2.5)
        interval: current interval in days
        repetitions: number of successful recalls

    Returns:
        (new_ease_factor, new_interval, new_repetitions)
    """
    if rating < 3:
        # Reset — review tomorrow
        new_interval = 1
        new_repetitions = 0
        new_ease_factor = ease_factor  # unchanged
    else:
        # Calculate new EF
        new_ease_factor = ease_factor + (
            0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)
        )
        # Floor guard
        new_ease_factor = max(1.3, new_ease_factor)

        # Calculate new interval
        if repetitions == 0:
            new_interval = 1
        elif repetitions == 1:
            new_interval = 6
        else:
            new_interval = round(interval * new_ease_factor)

        new_repetitions = repetitions + 1

    return new_ease_factor, new_interval, new_repetitions
