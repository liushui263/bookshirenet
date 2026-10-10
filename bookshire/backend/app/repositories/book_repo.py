from typing import List, Optional
from uuid import UUID

from sqlalchemy import Text, cast, or_
from sqlalchemy.orm import Session

from app.models.book import Book, Edition
from app.models.user_book import UserBook
from app.schemas.book import BookCreate, UserBookCreate


def create_book_with_edition(db: Session, data: BookCreate) -> Book:
    book = Book(
        title=data.title,
        subtitle=data.subtitle,
        original_language=data.original_language,
        canonical_cover_url=data.canonical_cover_url,
        canonical_description=data.canonical_description,
        canonical_description_language=data.canonical_description_language,
        categories=data.categories,
        tags=data.tags,
    )
    db.add(book)
    db.flush()

    edition = Edition(
        book_id=book.id,
        title=data.title,
        subtitle=data.subtitle,
        language=data.edition_language,
        isbn_10=data.isbn_10,
        isbn_13=data.isbn_13,
        publisher=data.publisher,
        publication_year=data.publication_year,
        format=data.format,
        cover_url=data.cover_url,
    )
    db.add(edition)

    db.commit()
    db.refresh(book)
    return book


def list_books(db: Session, limit: int = 50, offset: int = 0) -> List[Book]:
    return (
        db.query(Book)
        .order_by(Book.title.asc())
        .offset(offset)
        .limit(limit)
        .all()
    )


def get_book(db: Session, book_id: UUID) -> Optional[Book]:
    return db.query(Book).filter(Book.id == book_id).first()


def create_user_book(db: Session, data: UserBookCreate) -> UserBook:
    user_book = UserBook(**data.model_dump())
    db.add(user_book)
    db.commit()
    db.refresh(user_book)
    return user_book


def list_user_books(db: Session, user_id: UUID) -> List[UserBook]:
    return db.query(UserBook).filter(UserBook.user_id == user_id).all()


def get_book_by_id(db: Session, book_id: UUID) -> Optional[Book]:
    return db.query(Book).filter(Book.id == book_id).first()

def search_books(db: Session, q: str, limit: int = 20) -> List[Book]:
    """Search books by title, subtitle, normalized title, category, tag, or description."""
    cleaned = q.strip()
    if not cleaned:
        return []

    keyword = f"%{cleaned}%"

    filters = [
        Book.title.ilike(keyword),
        Book.subtitle.ilike(keyword),
        Book.normalized_title.ilike(keyword),
        cast(Book.categories, Text).ilike(keyword),
        cast(Book.tags, Text).ilike(keyword),
        Book.canonical_description.ilike(keyword),
    ]

    return (
        db.query(Book)
        .filter(or_(*filters))
        .order_by(Book.title.asc())
        .limit(limit)
        .all()
    )