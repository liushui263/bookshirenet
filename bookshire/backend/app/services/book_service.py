from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.book import Edition

from app.repositories.book_repo import (
    create_book_with_edition,
    create_user_book,
    get_book,
    list_books,
    list_user_books,
    get_book_by_id,
    search_books,
)
from app.schemas.book import BookCreate, UserBookCreate


def with_details(db: Session, books: list) -> list[dict]:
    """Book rows plus authors and first-edition facts, for lists that show them."""
    from app.services.library_service import authors_by_book

    if not books:
        return []
    ids = [book.id for book in books]
    authors = authors_by_book(db, ids)
    editions: dict = {}
    for edition in db.query(Edition).filter(Edition.book_id.in_(ids)).order_by(Edition.isbn_13.is_(None)).all():
        editions.setdefault(edition.book_id, edition)

    result = []
    for book in books:
        edition = editions.get(book.id)
        row = {column: getattr(book, column) for column in (
            "id", "title", "subtitle", "normalized_title", "original_language", "canonical_cover_url",
            "canonical_description", "avg_rating", "rating_count", "categories", "tags",
        )}
        row["rating_avg"] = book.avg_rating
        row["authors"] = authors.get(book.id, [])
        if edition is not None:
            row.update(
                publisher=edition.publisher,
                publication_year=edition.publication_year,
                isbn_13=edition.isbn_13,
                isbn_10=edition.isbn_10,
                page_count=edition.page_count,
                cover_url=edition.cover_url,
            )
        result.append(row)
    return result


def create_book_service(db: Session, data: BookCreate):
    return create_book_with_edition(db, data)


def list_books_service(db: Session, limit: int = 50, offset: int = 0):
    return with_details(db, list_books(db, limit=limit, offset=offset))


def get_book_service(db: Session, book_id: UUID):
    book = get_book(db, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


def create_user_book_service(db: Session, data: UserBookCreate):
    return create_user_book(db, data)


def list_user_books_service(db: Session, user_id: UUID):
    return list_user_books(db, user_id)


def get_book_detail(db: Session, book_id: str):
    book = get_book_by_id(db, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


def search_books_service(db: Session, q: str, limit: int = 20):
    if not q or not q.strip():
        return []

    return with_details(db, search_books(db, q=q, limit=limit))