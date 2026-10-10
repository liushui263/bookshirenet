from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.discovery_import import DiscoveryBookImport
from app.schemas.user_book import (
    UserBookCreate,
    UserBookOut,
    UserBookShelfOut,
    UserBookUpdate,
)
from app.services import user_book_service
from app.services.discovery_import_service import find_or_create_book


router = APIRouter(prefix="/me/books", tags=["my shelf"])


@router.get("", response_model=List[UserBookShelfOut])
def list_my_books(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return user_book_service.list_user_books(db, user.id)


@router.post("", response_model=UserBookOut, status_code=status.HTTP_201_CREATED)
def add_my_book(
    payload: UserBookCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_book_service.add_user_book(db, user.id, payload)


@router.post("/by-book/{book_id}", response_model=UserBookShelfOut, status_code=status.HTTP_201_CREATED)
def add_my_book_by_book_id(
    book_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_book_service.add_user_book_by_book_id(db, user.id, book_id)


@router.post("/import", response_model=UserBookShelfOut, status_code=status.HTTP_201_CREATED)
def import_discovery_book(
    payload: DiscoveryBookImport,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a book from the discovery shelves, creating it in the catalog on first use."""
    book = find_or_create_book(db, payload)
    return user_book_service.add_user_book_by_book_id(db, user.id, book.id)


@router.patch("/{user_book_id}", response_model=UserBookShelfOut)
def update_my_book(
    user_book_id: UUID,
    payload: UserBookUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_book_service.update_user_book(db, user.id, user_book_id, payload)


@router.delete("/{user_book_id}", response_model=UserBookOut)
def remove_my_book(
    user_book_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_book_service.remove_user_book(db, user.id, user_book_id)
