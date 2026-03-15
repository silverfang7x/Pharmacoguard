"""Drug-Drug Interaction (DDI) Safety Engine.

Normalises drug names via RxNorm, queries OpenFDA for label data,
scores severity, and caches results in Redis (24 h TTL).
"""

from __future__ import annotations

import hashlib
import json
import logging
from enum import StrEnum
from itertools import combinations

import httpx

from app.db.redis import redis_client

logger = logging.getLogger(__name__)

OPENFDA_LABEL_URL = "https://api.fda.gov/drug/label.json"
RXNORM_APPROX_URL = "https://rxnav.nlm.nih.gov/REST/approximateTerm.json"
RXNORM_INTERACTION_URL = "https://rxnav.nlm.nih.gov/REST/interaction/list.json"

CACHE_TTL = 86_400  # 24 hours

# ── Severity keywords used for heuristic scoring ──
_CRITICAL_KEYWORDS = [
    "contraindicated",
    "life-threatening",
    "fatal",
    "death",
    "do not use",
    "black box",
    "qtc prolongation",
    "serotonin syndrome",
    "torsades",
]
_HIGH_KEYWORDS = [
    "serious",
    "severe",
    "significant",
    "major",
    "bleeding risk",
    "hepatotoxicity",
    "nephrotoxicity",
    "hypotension",
]
_MODERATE_KEYWORDS = [
    "moderate",
    "monitor",
    "caution",
    "adjust dose",
    "increased effect",
    "decreased effect",
]


class Severity(StrEnum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MODERATE = "MODERATE"
    LOW = "LOW"


class DDIResult:
    """Single drug-drug interaction finding."""

    __slots__ = ("drug_a", "drug_b", "severity", "description", "source")

    def __init__(
        self,
        drug_a: str,
        drug_b: str,
        severity: Severity,
        description: str,
        source: str,
    ) -> None:
        self.drug_a = drug_a
        self.drug_b = drug_b
        self.severity = severity
        self.description = description
        self.source = source

    def to_dict(self) -> dict:
        return {
            "drug_a": self.drug_a,
            "drug_b": self.drug_b,
            "severity": self.severity.value,
            "description": self.description,
            "source": self.source,
        }


# ─────────────────────────── helpers ───────────────────────────


def _cache_key(drug_list: list[str]) -> str:
    """Deterministic cache key regardless of input ordering."""
    normalised = sorted(d.strip().lower() for d in drug_list)
    raw = "|".join(normalised)
    return f"ddi:{hashlib.sha256(raw.encode()).hexdigest()}"


def _score_text(text: str) -> Severity:
    """Score a blob of interaction text by keyword matching."""
    lower = text.lower()
    for kw in _CRITICAL_KEYWORDS:
        if kw in lower:
            return Severity.CRITICAL
    for kw in _HIGH_KEYWORDS:
        if kw in lower:
            return Severity.HIGH
    for kw in _MODERATE_KEYWORDS:
        if kw in lower:
            return Severity.MODERATE
    return Severity.LOW


# ─────────────────── RxNorm normalisation ───────────────────────


async def _normalise_drug_name(client: httpx.AsyncClient, name: str) -> str:
    """Use RxNorm approximate-term API to get the canonical drug name."""
    try:
        resp = await client.get(
            RXNORM_APPROX_URL,
            params={"term": name, "maxEntries": 1},
        )
        resp.raise_for_status()
        data = resp.json()
        candidates = (
            data.get("approximateGroup", {}).get("candidate", [])
        )
        if candidates:
            return candidates[0].get("name", name)
    except Exception:
        logger.warning("RxNorm normalisation failed for %s – using raw name", name)
    return name


# ──────────────────── OpenFDA lookup ────────────────────────


async def _query_openfda_pair(
    client: httpx.AsyncClient,
    drug_a: str,
    drug_b: str,
) -> list[DDIResult]:
    """Search OpenFDA drug labels for interaction text mentioning both drugs."""
    results: list[DDIResult] = []
    search = f'drug_interactions:"{drug_a}"+AND+drug_interactions:"{drug_b}"'
    try:
        resp = await client.get(
            OPENFDA_LABEL_URL,
            params={"search": search, "limit": 3},
        )
        if resp.status_code == 200:
            for hit in resp.json().get("results", []):
                texts = hit.get("drug_interactions", [])
                for text in texts:
                    severity = _score_text(text)
                    results.append(
                        DDIResult(
                            drug_a=drug_a,
                            drug_b=drug_b,
                            severity=severity,
                            description=text[:500],
                            source="OpenFDA",
                        )
                    )
    except Exception:
        logger.warning("OpenFDA query failed for %s / %s", drug_a, drug_b)
    return results


# ────────────────── RxNorm interaction API ──────────────────


async def _query_rxnorm_interactions(
    client: httpx.AsyncClient,
    rxcuis: list[str],
) -> list[DDIResult]:
    """Query NIH RxNorm interaction list endpoint."""
    results: list[DDIResult] = []
    if len(rxcuis) < 2:
        return results
    try:
        resp = await client.get(
            RXNORM_INTERACTION_URL,
            params={"rxcuis": "+".join(rxcuis)},
        )
        if resp.status_code != 200:
            return results
        data = resp.json()
        for group in data.get("fullInteractionTypeGroup", []):
            for itype in group.get("fullInteractionType", []):
                for pair in itype.get("interactionPair", []):
                    desc = pair.get("description", "")
                    severity_str = pair.get("severity", "N/A")
                    names = [
                        c.get("minConceptItem", {}).get("name", "Unknown")
                        for c in pair.get("interactionConcept", [])
                    ]
                    drug_a = names[0] if len(names) > 0 else "Unknown"
                    drug_b = names[1] if len(names) > 1 else "Unknown"
                    severity = _score_text(f"{severity_str} {desc}")
                    results.append(
                        DDIResult(
                            drug_a=drug_a,
                            drug_b=drug_b,
                            severity=severity,
                            description=desc[:500],
                            source="RxNorm",
                        )
                    )
    except Exception:
        logger.warning("RxNorm interaction query failed")
    return results


async def _resolve_rxcui(client: httpx.AsyncClient, name: str) -> str | None:
    """Get the RxCUI for a drug name (needed for interaction list API)."""
    try:
        resp = await client.get(
            "https://rxnav.nlm.nih.gov/REST/rxcui.json",
            params={"name": name, "search": 2},
        )
        if resp.status_code == 200:
            ids = resp.json().get("idGroup", {}).get("rxnormId", [])
            if ids:
                return ids[0]
    except Exception:
        pass
    return None


# ──────────────────── public entry point ────────────────────


async def check_interactions(drug_list: list[str]) -> list[DDIResult]:
    """Run the full DDI pipeline: normalise → query → score → cache.

    Returns a list of DDIResult objects sorted by severity (CRITICAL first).
    """
    if len(drug_list) < 2:
        return []

    # 1. Check cache
    key = _cache_key(drug_list)
    cached = await redis_client.get(key)
    if cached is not None:
        return [
            DDIResult(**item)
            for item in json.loads(cached)
        ]

    all_results: list[DDIResult] = []

    async with httpx.AsyncClient(timeout=15.0) as client:
        # 2. Normalise via RxNorm
        normalised: list[str] = []
        for drug in drug_list:
            norm = await _normalise_drug_name(client, drug)
            normalised.append(norm)

        # 3. Resolve RxCUIs for interaction list API
        rxcuis: list[str] = []
        for name in normalised:
            rxcui = await _resolve_rxcui(client, name)
            if rxcui:
                rxcuis.append(rxcui)

        # 4. Query RxNorm interaction list (covers all pairs at once)
        rxnorm_results = await _query_rxnorm_interactions(client, rxcuis)
        all_results.extend(rxnorm_results)

        # 5. Query OpenFDA for every pair (supplementary data)
        seen_pairs: set[tuple[str, str]] = {
            (r.drug_a.lower(), r.drug_b.lower()) for r in rxnorm_results
        }
        for a, b in combinations(normalised, 2):
            if (a.lower(), b.lower()) not in seen_pairs:
                fda_results = await _query_openfda_pair(client, a, b)
                all_results.extend(fda_results)

    # 6. Deduplicate by (drug_a, drug_b, source)
    unique: dict[tuple[str, str, str], DDIResult] = {}
    for r in all_results:
        triplet = (r.drug_a.lower(), r.drug_b.lower(), r.source)
        if triplet not in unique or _sev_rank(r.severity) < _sev_rank(unique[triplet].severity):
            unique[triplet] = r
    deduped = list(unique.values())

    # 7. Sort by severity (CRITICAL first)
    severity_order = {Severity.CRITICAL: 0, Severity.HIGH: 1, Severity.MODERATE: 2, Severity.LOW: 3}
    deduped.sort(key=lambda r: severity_order.get(r.severity, 99))

    # 8. Cache for 24 hours
    try:
        await redis_client.set(
            key,
            json.dumps([r.to_dict() for r in deduped]),
            ex=CACHE_TTL,
        )
    except Exception:
        logger.warning("Failed to cache DDI results")

    return deduped


def _sev_rank(s: Severity) -> int:
    return {Severity.CRITICAL: 0, Severity.HIGH: 1, Severity.MODERATE: 2, Severity.LOW: 3}.get(s, 99)


def compute_overall_risk(results: list[DDIResult]) -> str:
    """Compute an overall risk score based on the worst interaction found."""
    if not results:
        return "NONE"
    worst = results[0].severity  # already sorted
    return worst.value
