"""Adverse Event reporting endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import Role, get_current_user, require_role
from app.db.session import get_db
from app.models.adverse_event import AdverseEvent
from app.schemas.adverse_event import AdverseEventCreate, AdverseEventRead

router = APIRouter()


@router.post("/", response_model=AdverseEventRead, status_code=status.HTTP_201_CREATED)
async def report_adverse_event(
    payload: AdverseEventCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = AdverseEvent(
        **payload.model_dump(),
        reporter_id=current_user["sub"],
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


@router.get("/", response_model=list[AdverseEventRead])
async def list_adverse_events(
    _user: dict = Depends(require_role(Role.DOCTOR, Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AdverseEvent).order_by(AdverseEvent.created_at.desc()))
    return list(result.scalars().all())


@router.get("/{event_id}", response_model=AdverseEventRead)
async def get_adverse_event(
    event_id: uuid.UUID,
    _user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AdverseEvent).where(AdverseEvent.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event
