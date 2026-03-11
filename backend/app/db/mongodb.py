"""MongoDB client for audit / event logs."""

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings

mongo_client: AsyncIOMotorClient = AsyncIOMotorClient(settings.MONGODB_URI)  # type: ignore[type-arg]
mongo_db = mongo_client[settings.MONGODB_DB_NAME]

# Collections
logs_collection = mongo_db["logs"]
ai_interactions_collection = mongo_db["ai_interactions"]
