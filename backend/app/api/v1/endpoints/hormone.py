"""Hormone-Sync API – cycle logging, drug warnings, correlation & forecast."""

from __future__ import annotations

import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.hormone_cycle_log import HormoneCycleLog
from app.schemas.hormone import (
    CycleDrugWarning,
    CycleLogCreate,
    CycleLogRead,
    CorrelationResult,
    ForecastResponse,
)
from app.services.hormone_sync import HormoneSyncService

router = APIRouter()


# ── CRUD: log a cycle day ──


@router.post("/log", response_model=CycleLogRead, status_code=201)
async def create_cycle_log(
    body: CycleLogCreate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CycleLogRead:
    user_id = uuid.UUID(user["sub"])

    # Upsert — replace existing entry for the same date
    existing = (
        await db.execute(
            select(HormoneCycleLog).where(
                and_(
                    HormoneCycleLog.user_id == user_id,
                    HormoneCycleLog.date == body.date,
                )
            )
        )
    ).scalar_one_or_none()

    if existing:
        existing.cycle_day = body.cycle_day
        existing.phase = body.phase
        existing.flow_intensity = body.flow_intensity
        existing.mood_score = body.mood_score
        existing.energy_score = body.energy_score
        await db.commit()
        await db.refresh(existing)
        return CycleLogRead.model_validate(existing)

    log = HormoneCycleLog(
        user_id=user_id,
        date=body.date,
        cycle_day=body.cycle_day,
        phase=body.phase,
        flow_intensity=body.flow_intensity,
        mood_score=body.mood_score,
        energy_score=body.energy_score,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return CycleLogRead.model_validate(log)


# ── Read recent logs ──


@router.get("/logs", response_model=list[CycleLogRead])
async def list_cycle_logs(
    days: int = 30,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[CycleLogRead]:
    user_id = uuid.UUID(user["sub"])
    cutoff = date.today().replace(day=1) if days >= 30 else date.today()
    from datetime import timedelta

    cutoff = date.today() - timedelta(days=days)
    rows = (
        await db.execute(
            select(HormoneCycleLog)
            .where(
                and_(
                    HormoneCycleLog.user_id == user_id,
                    HormoneCycleLog.date >= cutoff,
                )
            )
            .order_by(HormoneCycleLog.date.desc())
        )
    ).scalars().all()
    return [CycleLogRead.model_validate(r) for r in rows]


# ── Correlation ──


@router.get("/correlate/{drug_name}", response_model=CorrelationResult)
async def correlate(
    drug_name: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CorrelationResult:
    svc = HormoneSyncService(db)
    return await svc.correlate_cycle_drug_effects(uuid.UUID(user["sub"]), drug_name)


# ── Cycle-drug warning ──


@router.get("/cycle-drug-warning/{drug_id}", response_model=CycleDrugWarning)
async def cycle_drug_warning(
    drug_id: uuid.UUID,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CycleDrugWarning:
    svc = HormoneSyncService(db)
    return await svc.get_cycle_drug_warning(uuid.UUID(user["sub"]), drug_id)


# ── 5-day forecast ──


@router.get("/forecast", response_model=ForecastResponse)
async def forecast(
    drugs: str = "",
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ForecastResponse:
    drug_list = [d.strip() for d in drugs.split(",") if d.strip()] if drugs else []
    svc = HormoneSyncService(db)
    return await svc.forecast(uuid.UUID(user["sub"]), drug_list)
