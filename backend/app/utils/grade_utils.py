"""Grade utilities."""


def compute_grade(percentage: float) -> str:
    """Return letter grade from percentage (0-100)."""
    if percentage >= 90:
        return "A+"
    elif percentage >= 80:
        return "A"
    elif percentage >= 70:
        return "B"
    elif percentage >= 60:
        return "C"
    elif percentage >= 50:
        return "D"
    else:
        return "F"


def compute_percentage(total: float, max_total: float) -> float:
    if max_total <= 0:
        return 0.0
    return round((total / max_total) * 100, 2)


def recompute_total(evaluations: list) -> float:
    """Server-side sum of final_marks, clamped to max_marks per question."""
    total = 0.0
    for ev in evaluations:
        marks = ev.final_marks if ev.final_marks is not None else 0.0
        max_m = ev.max_marks if ev.max_marks is not None else 0.0
        total += max(0.0, min(marks, max_m))
    return round(total, 2)
