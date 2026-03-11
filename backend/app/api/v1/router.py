"""API v1 – top-level router aggregating all sub-routers."""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, medications, adverse_events, ai

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(medications.router, prefix="/medications", tags=["medications"])
api_router.include_router(adverse_events.router, prefix="/adverse-events", tags=["adverse-events"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
