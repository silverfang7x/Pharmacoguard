"""Medication CRUD endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import Role, get_current_user, require_role
from app.db.session import get_db
from app.models.medication import Medication
from app.schemas.medication import MedicationCreate, MedicationRead

router = APIRouter()


@router.get("/", response_model=list[MedicationRead])
async def list_medications(
    _user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Medication).order_by(Medication.name))
    return list(result.scalars().all())


@router.get("/{medication_id}", response_model=MedicationRead)
async def get_medication(
    medication_id: uuid.UUID,
    _user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Medication).where(Medication.id == medication_id))
    med = result.scalar_one_or_none()
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")
    return med


@router.post("/", response_model=MedicationRead, status_code=status.HTTP_201_CREATED)
async def create_medication(
    payload: MedicationCreate,
    _doctor: dict = Depends(require_role(Role.DOCTOR, Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    med = Medication(**payload.model_dump())
    db.add(med)
    await db.commit()
    await db.refresh(med)
    return med
