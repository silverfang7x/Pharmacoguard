"""Hormone Cycle Log model for menstrual cycle tracking."""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, Float, Integer, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class HormoneCycleLog(Base):
    __tablename__ = "hormone_cycle_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    cycle_day: Mapped[int] = mapped_column(Integer, nullable=False)
    phase: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # follicular / ovulatory / luteal / menstrual
    flow_intensity: Mapped[float | None] = mapped_column(Float, nullable=True)  # 0-5
    mood_score: Mapped[float | None] = mapped_column(Float, nullable=True)  # 1-10
    energy_score: Mapped[float | None] = mapped_column(Float, nullable=True)  # 1-10
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
