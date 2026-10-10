from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.book import BookCreate, BookOut, UserBookCreate, UserBookOut
from app.services.book_service import (
    create_book_service,
    create_user_book_service,
    get_book_service, get_book_detail, search_books_service,
    list_books_service,
    list_user_books_service,
)

router = APIRouter(prefix="/books", tags=["books"])


@router.post("/", response_model=BookOut)
def create_book(payload: BookCreate, db: Session = Depends(get_db)):
    return create_book_service(db, payload)


@router.get("/", response_model=List[BookOut])
def list_books(limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    return list_books_service(db, limit=limit, offset=offset)

@router.get("/search", response_model=List[BookOut])
def search_books(
    q: str = Query(..., min_length=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return search_books_service(db, q=q, limit=limit)

@router.get("/{book_id}", response_model=BookOut)
def get_book(book_id: UUID, db: Session = Depends(get_db)):
    return get_book_service(db, book_id)

@router.post("/user-books", response_model=UserBookOut)
def add_user_book(payload: UserBookCreate, db: Session = Depends(get_db)):
    return create_user_book_service(db, payload)

@router.get("/user-books/{user_id}", response_model=List[UserBookOut])
def get_user_books(user_id: UUID, db: Session = Depends(get_db)):
    return list_user_books_service(db, user_id)