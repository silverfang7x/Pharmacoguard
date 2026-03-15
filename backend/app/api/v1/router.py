"""API v1 – top-level router aggregating all sub-routers."""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, medications, adverse_events, ai, safety, scheduler, knowledge, hormone, refill, gamification, analytics

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(medications.router, prefix="/medications", tags=["medications"])
api_router.include_router(adverse_events.router, prefix="/adverse-events", tags=["adverse-events"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(safety.router, prefix="/safety", tags=["safety"])
api_router.include_router(scheduler.router, prefix="/scheduler", tags=["scheduler"])
api_router.include_router(knowledge.router, prefix="/medications", tags=["knowledge-vault"])
api_router.include_router(hormone.router, prefix="/hormone", tags=["hormone-sync"])
api_router.include_router(refill.router, prefix="/refill", tags=["refill-predictor"])
api_router.include_router(gamification.router, prefix="/gamification", tags=["gamification"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
