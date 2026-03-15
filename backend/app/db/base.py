"""SQLAlchemy declarative base – import all models here for metadata discovery."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import models so Alembic / create_all can discover them
from app.models import user, medication, adverse_event, hormone_cycle_log  # noqa: E402, F401
