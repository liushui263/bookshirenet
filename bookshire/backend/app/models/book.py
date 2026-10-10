from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import ARRAY, ENUM, JSONB, UUID
from sqlalchemy.orm import relationship

from app.db.base import Base

# Postgres enum types created by db/init.sql.
metadata_source_enum = ENUM(
    "google_books", "open_library", "user", "ocr", "vision", "import", "admin",
    name="metadata_source",
    create_type=False,
)
book_format_enum = ENUM(
    "hardcover", "paperback", "ebook", "audiobook", "unknown",
    name="book_format",
    create_type=False,
)


class Book(Base):
    __tablename__ = "books"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    title = Column(Text, nullable=False)
    subtitle = Column(Text)
    normalized_title = Column(Text)
    original_language = Column(String(10))
    canonical_cover_url = Column(Text)
    canonical_description = Column(Text)
    canonical_description_language = Column(String(10))
    categories = Column(ARRAY(Text), nullable=False, server_default=text("ARRAY[]::text[]"))
    tags = Column(ARRAY(Text), nullable=False, server_default=text("ARRAY[]::text[]"))
    metadata_source = Column(metadata_source_enum, nullable=False, server_default=text("'user'"))
    external_ids = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    avg_rating = Column(Numeric(3, 2), nullable=False, server_default=text("0"))
    rating_count = Column(Integer, nullable=False, server_default=text("0"))
    popularity_score = Column(Numeric(12, 4), nullable=False, server_default=text("0"))

    editions = relationship("Edition", back_populates="book")

    @property
    def rating_avg(self):
        return self.avg_rating


class Edition(Base):
    __tablename__ = "editions"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id", ondelete="CASCADE"), nullable=False)

    title = Column(Text)
    subtitle = Column(Text)
    language = Column(String(10), nullable=False)
    isbn_10 = Column(String(10))
    isbn_13 = Column(String(13))
    publisher = Column(Text)
    publication_year = Column(Integer)
    page_count = Column(Integer)
    format = Column(book_format_enum, nullable=False, server_default=text("'unknown'"))
    cover_url = Column(Text)
    metadata_source = Column(metadata_source_enum, nullable=False, server_default=text("'user'"))
    external_ids = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))

    book = relationship("Book", back_populates="editions")
    user_books = relationship("UserBook", back_populates="edition")

""" 
class UserBook(Base):
    __tablename__ = "user_books"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    edition_id = Column(UUID(as_uuid=True), ForeignKey("editions.id"), nullable=False)

    status = Column(String, nullable=False, server_default=text("'unread'"))
    condition = Column(Integer)
    location_text = Column(Text)
    exchangeable = Column(Boolean, nullable=False, server_default=text("false"))
    visibility = Column(String, nullable=False, server_default=text("'private'"))

    edition = relationship("Edition", back_populates="user_books")
    """