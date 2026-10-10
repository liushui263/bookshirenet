from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

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


def create_book_service(db: Session, data: BookCreate):
    return create_book_with_edition(db, data)


def list_books_service(db: Session, limit: int = 50, offset: int = 0):
    return list_books(db, limit=limit, offset=offset)


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

    return search_books(db, q=q, limit=limit)