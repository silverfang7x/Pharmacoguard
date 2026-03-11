"""Pydantic v2 schemas for Adverse Event domain."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AdverseEventBase(BaseModel):
    medication_id: uuid.UUID
    severity: str = "moderate"
    description: str


class AdverseEventCreate(AdverseEventBase):
    pass


class AdverseEventRead(AdverseEventBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    reporter_id: uuid.UUID
    ai_analysis: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime
