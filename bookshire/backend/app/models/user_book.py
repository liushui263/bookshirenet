from sqlalchemy import Column, Integer, Text, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY, ENUM
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


reading_status_enum = ENUM(
    "unread",
    "reading",
    "read",
    "abandoned",
    name="reading_status",
    create_type=False,
)

visibility_level_enum = ENUM(
    "private",
    "friends",
    "public",
    name="visibility_level",
    create_type=False,
)


class UserBook(Base):
    __tablename__ = "user_books"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    edition_id = Column(UUID(as_uuid=True), ForeignKey("editions.id", ondelete="RESTRICT"), nullable=False, index=True)

    status = Column(reading_status_enum, nullable=False, server_default="unread")

    condition = Column(Integer, nullable=True)
    location_text = Column(Text, nullable=True)

    exchangeable = Column(Boolean, nullable=False, server_default="false")
    visibility = Column(visibility_level_enum, nullable=False, server_default="private")

    user_cover_image_id = Column(UUID(as_uuid=True), nullable=True)

    personal_tags = Column(ARRAY(Text), nullable=False, server_default="{}")
    personal_notes_summary = Column(Text, nullable=True)

    acquired_at = Column(Date, nullable=True)
    started_at = Column(Date, nullable=True)
    finished_at = Column(Date, nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    edition = relationship(
        "Edition",
        primaryjoin="foreign(UserBook.edition_id) == Edition.id",
        back_populates="user_books",
    )
    
    