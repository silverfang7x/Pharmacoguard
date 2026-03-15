"""Pydantic v2 schemas for the Doctor / Pharma Analytics dashboard."""

from __future__ import annotations

from datetime import date
from pydantic import BaseModel, Field


# ── Doctor Overview ──


class DrugAdherenceStat(BaseModel):
    drug_name: str
    adherence_rate: float = Field(ge=0.0, le=1.0)


class SideEffectStat(BaseModel):
    drug_name: str
    side_effect: str
    count: int


class DoctorOverviewResponse(BaseModel):
    total_patients: int
    avg_adherence_rate: float = Field(ge=0.0, le=1.0)
    top_non_adhered_drugs: list[DrugAdherenceStat]
    common_side_effects_by_drug: list[SideEffectStat]
    ddi_flags_this_month: int


# ── Drug Dropout Analysis ──


class AdherenceTimePoint(BaseModel):
    day: int
    adherence_rate: float = Field(ge=0.0, le=1.0)


class DropoutAnalysisResponse(BaseModel):
    drug_name: str
    dropout_rate_week1: float = Field(ge=0.0, le=1.0)
    dropout_rate_week4: float = Field(ge=0.0, le=1.0)
    top_dropout_reasons: list[str]
    time_series_adherence: list[AdherenceTimePoint]


# ── Aggregated dashboard payload (for the frontend page) ──


class LowAdherencePatient(BaseModel):
    patient_id: str
    initials: str  # anonymized
    adherence_rate: float = Field(ge=0.0, le=1.0)
    missed_doses_this_week: int
    primary_drug: str


class AdherenceDistributionBucket(BaseModel):
    bucket: str  # e.g. "90-100%", "80-89%"
    count: int


class DashboardAggregateResponse(BaseModel):
    overview: DoctorOverviewResponse
    adherence_distribution: list[AdherenceDistributionBucket]
    low_adherence_patients: list[LowAdherencePatient]
    refill_alerts_count: int
