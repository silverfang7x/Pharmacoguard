"""Pydantic v2 schemas for User domain."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict

from app.core.security import Role


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: Role = Role.PATIENT


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    supabase_uid: str | None = None
    created_at: datetime
    updated_at: datetime


class UserUpdate(BaseModel):
    full_name: str | None = None
    role: Role | None = None
