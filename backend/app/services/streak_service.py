"""Gamification / Streak service – calculates streaks and badges from MongoDB adherence data."""

from __future__ import annotations

from datetime import date, timedelta

from app.db.mongodb import medication_schedules_collection
from app.schemas.gamification import Badge, StreakResponse

# ── Badge definitions ──

BADGE_MILESTONES: list[tuple[int, str, str, str]] = [
    (3,   "bronze", "🛡️",  "3-Day Warrior"),
    (7,   "bronze", "🔥",  "Week Streak"),
    (14,  "silver", "⚡",  "Two-Week Champion"),
    (30,  "silver", "🏅",  "Monthly Master"),
    (60,  "gold",   "👑",  "60-Day Legend"),
    (100, "gold",   "💎",  "Century Star"),
    (365, "gold",   "🏆",  "Year of Commitment"),
]


def _compute_badges(longest_streak: int, total_perfect: int) -> list[Badge]:
    """Award badges based on longest streak and total perfect days."""
    earned: list[Badge] = []
    for threshold, tier, icon, name in BADGE_MILESTONES:
        if longest_streak >= threshold or total_perfect >= threshold:
            earned.append(
                Badge(
                    name=name,
                    tier=tier,
                    icon=icon,
                    description=f"Achieved {threshold}+ {'consecutive' if longest_streak >= threshold else 'total'} perfect days",
                )
            )
    return earned


def _next_milestone(current_streak: int) -> int:
    """Return the next streak milestone the user hasn't hit yet."""
    for threshold, *_ in BADGE_MILESTONES:
        if current_streak < threshold:
            return threshold
    return BADGE_MILESTONES[-1][0] + 100  # beyond all badges


async def compute_streak(patient_id: str) -> StreakResponse:
    """Calculate streak data from MongoDB medication_schedules."""

    # Fetch up to 1 year of schedule docs
    cutoff = (date.today() - timedelta(days=365)).isoformat()
    cursor = medication_schedules_collection.find(
        {"user_id": patient_id, "date": {"$gte": cutoff}},
    ).sort("date", 1)
    docs = await cursor.to_list(length=400)

    if not docs:
        return StreakResponse(
            patient_id=patient_id,
            current_streak=0,
            longest_streak=0,
            total_perfect_days=0,
            badges_earned=[],
            next_milestone=3,
            weekly_progress=[False] * 7,
        )

    # Build a set of dates with perfect adherence
    perfect_dates: set[date] = set()
    for doc in docs:
        doc_date_str = doc.get("date", "")
        slots = doc.get("slots", [])
        if not slots:
            continue
        all_taken = all(s.get("taken") for s in slots)
        if all_taken:
            try:
                perfect_dates.add(date.fromisoformat(doc_date_str))
            except (ValueError, TypeError):
                continue

    total_perfect = len(perfect_dates)

    # Current streak — count backwards from today
    today = date.today()
    current_streak = 0
    d = today
    while d in perfect_dates:
        current_streak += 1
        d -= timedelta(days=1)

    # If today not yet logged, check yesterday as anchor
    if current_streak == 0:
        d = today - timedelta(days=1)
        while d in perfect_dates:
            current_streak += 1
            d -= timedelta(days=1)

    # Longest streak — scan all dates
    if perfect_dates:
        sorted_dates = sorted(perfect_dates)
        longest = 1
        run = 1
        for i in range(1, len(sorted_dates)):
            if sorted_dates[i] - sorted_dates[i - 1] == timedelta(days=1):
                run += 1
                longest = max(longest, run)
            else:
                run = 1
        longest_streak = longest
    else:
        longest_streak = 0

    # Weekly progress — last 7 days
    weekly: list[bool] = []
    for offset in range(6, -1, -1):  # 6 days ago → today
        weekly.append((today - timedelta(days=offset)) in perfect_dates)

    badges = _compute_badges(longest_streak, total_perfect)

    return StreakResponse(
        patient_id=patient_id,
        current_streak=current_streak,
        longest_streak=longest_streak,
        total_perfect_days=total_perfect,
        badges_earned=badges,
        next_milestone=_next_milestone(current_streak),
        weekly_progress=weekly,
    )
