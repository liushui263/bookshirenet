from sqlalchemy import Column, DateTime, Float, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import ARRAY, ENUM, UUID
from sqlalchemy.sql import func

from app.db.base import Base


user_status_enum = ENUM(
    "active",
    "inactive",
    "banned",
    "deleted",
    name="user_status",
    create_type=False,
)


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))

    email = Column(String, nullable=True, unique=True)
    username = Column(String, nullable=True, unique=True)
    display_name = Column(String, nullable=False)

    avatar_url = Column(Text, nullable=True)
    bio = Column(Text, nullable=True)

    status = Column(user_status_enum, nullable=False, server_default="active")

    preferred_languages = Column(ARRAY(String), nullable=False, server_default=text("ARRAY['en']::text[]"))

    rating_count = Column(Integer, nullable=False, server_default=text("0"))
    review_count = Column(Integer, nullable=False, server_default=text("0"))
    exchange_count = Column(Integer, nullable=False, server_default=text("0"))
    trust_score = Column(Float, nullable=False, server_default=text("0"))

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
