from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text, text
from sqlalchemy.dialects.postgresql import ENUM, UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


visibility_level_enum = ENUM(
    "private",
    "friends",
    "public",
    name="visibility_level",
    create_type=False,
)


class Review(Base):
    __tablename__ = "reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id", ondelete="CASCADE"), nullable=False, index=True)
    edition_id = Column(UUID(as_uuid=True), ForeignKey("editions.id", ondelete="SET NULL"), nullable=True)

    rating = Column(Integer, nullable=True)
    content = Column(Text, nullable=True)
    visibility = Column(visibility_level_enum, nullable=False, server_default="public", index=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    book = relationship("Book")
    user = relationship("User")
    edition = relationship("Edition")