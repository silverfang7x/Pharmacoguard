"""Auth endpoints – Supabase-backed sign-up / sign-in."""

from fastapi import APIRouter, HTTPException, status
from supabase import create_client

from app.core.config import settings
from app.schemas.user import UserCreate

router = APIRouter()

_supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(payload: UserCreate):
    """Register a new user via Supabase Auth."""
    try:
        res = _supabase.auth.sign_up(
            {
                "email": payload.email,
                "password": payload.password,
                "options": {
                    "data": {
                        "full_name": payload.full_name,
                        "role": payload.role.value,
                    }
                },
            }
        )
        return {"message": "User created", "user_id": res.user.id if res.user else None}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/login")
async def login(email: str, password: str):
    """Sign in and return Supabase JWT tokens."""
    try:
        res = _supabase.auth.sign_in_with_password({"email": email, "password": password})
        return {
            "access_token": res.session.access_token,
            "refresh_token": res.session.refresh_token,
            "user": {"id": res.user.id, "email": res.user.email},
        }
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
