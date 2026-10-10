from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.user_book import (
    UserBookCreate,
    UserBookOut,
    UserBookShelfOut,
    UserBookUpdate,
)
from app.services import user_book_service


router = APIRouter(prefix="/users/{user_id}/books", tags=["user_books"])


@router.get("", response_model=List[UserBookShelfOut])
def list_user_books(user_id: UUID, db: Session = Depends(get_db)):
    return user_book_service.list_user_books(db, user_id)


@router.post("", response_model=UserBookOut, status_code=status.HTTP_201_CREATED)
def add_user_book(
    user_id: UUID,
    payload: UserBookCreate,
    db: Session = Depends(get_db),
):
    return user_book_service.add_user_book(db, user_id, payload)

@router.post("/by-book/{book_id}", response_model=UserBookShelfOut, status_code=status.HTTP_201_CREATED)
def add_user_book_by_book_id(
    user_id: UUID,
    book_id: UUID,
    db: Session = Depends(get_db),
):
    return user_book_service.add_user_book_by_book_id(db, user_id, book_id)

@router.patch("/{user_book_id}", response_model=UserBookShelfOut)
def update_user_book(
    user_id: UUID,
    user_book_id: UUID,
    payload: UserBookUpdate,
    db: Session = Depends(get_db),
):
    return user_book_service.update_user_book(db, user_id, user_book_id, payload)


@router.delete("/{user_book_id}", response_model=UserBookOut)
def remove_user_book(
    user_id: UUID,
    user_book_id: UUID,
    db: Session = Depends(get_db),
):
    return user_book_service.remove_user_book(db, user_id, user_book_id)
