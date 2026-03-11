"""Pydantic v2 schemas for Medication domain."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MedicationBase(BaseModel):
    name: str
    generic_name: str | None = None
    description: str | None = None
    dosage_form: str | None = None
    manufacturer: str | None = None


class MedicationCreate(MedicationBase):
    pass


class MedicationRead(MedicationBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
