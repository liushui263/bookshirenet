from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.book import BookCreate, BookOut
from app.services.book_service import (
    create_book_service,
    get_book_service, search_books_service,
    list_books_service,
)

router = APIRouter(prefix="/books", tags=["books"])


@router.post("/", response_model=BookOut)
def create_book(
    payload: BookCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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
