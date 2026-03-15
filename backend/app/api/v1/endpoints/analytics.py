"""Analytics endpoints — Doctor / Pharma analytics dashboard (anonymised, aggregated)."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.security import get_current_user, require_role, Role
from app.schemas.analytics import (
    DoctorOverviewResponse,
    DropoutAnalysisResponse,
    DashboardAggregateResponse,
)
from app.services.analytics_service import (
    compute_doctor_overview,
    compute_dropout_analysis,
    compute_adherence_distribution,
    compute_low_adherence_patients,
    count_refill_alerts,
    _patient_ids_for_doctor,
    _all_patient_ids,
)

router = APIRouter()


@router.get("/doctor/{doctor_id}/overview", response_model=DoctorOverviewResponse)
async def doctor_overview(
    doctor_id: str,
    _user: dict = Depends(require_role(Role.DOCTOR, Role.ADMIN)),
):
    """Aggregated, anonymised overview for a doctor's patient panel."""
    return await compute_doctor_overview(doctor_id)


@router.get("/drug/{drug_id}/dropout-analysis", response_model=DropoutAnalysisResponse)
async def drug_dropout_analysis(
    drug_id: str,
    _user: dict = Depends(require_role(Role.DOCTOR, Role.ADMIN)),
):
    """Adherence drop-off analysis for a specific drug."""
    return await compute_dropout_analysis(drug_id)


@router.get("/doctor/{doctor_id}/dashboard", response_model=DashboardAggregateResponse)
async def doctor_dashboard(
    doctor_id: str,
    _user: dict = Depends(require_role(Role.DOCTOR, Role.ADMIN)),
):
    """Full dashboard aggregate — overview + distribution + low-adherence table + refill alerts."""
    overview = await compute_doctor_overview(doctor_id)
    patient_ids = await _patient_ids_for_doctor(doctor_id)
    if not patient_ids:
        patient_ids = await _all_patient_ids()

    distribution = await compute_adherence_distribution(patient_ids)
    low_patients = await compute_low_adherence_patients(patient_ids)
    refill_count = await count_refill_alerts(patient_ids)

    return DashboardAggregateResponse(
        overview=DoctorOverviewResponse(**overview),
        adherence_distribution=distribution,
        low_adherence_patients=low_patients,
        refill_alerts_count=refill_count,
    )
