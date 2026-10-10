from typing import List
from uuid import UUID

from datetime import date

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse, Response
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.discovery_import import DiscoveryBookImport
from app.schemas.user_book import (
    AddByIsbnIn,
    ShelfImportIn,
    ShelfImportOut,
    UserBookCreate,
    UserBookOut,
    UserBookShelfOut,
    UserBookUpdate,
)
from app.services import library_service, user_book_service
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


@router.post("/isbn", response_model=UserBookShelfOut, status_code=status.HTTP_201_CREATED)
def add_my_book_by_isbn(
    payload: AddByIsbnIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a book by ISBN-10 or ISBN-13, looking it up on Google Books / Open Library if new."""
    return library_service.add_by_isbn(db, user.id, payload.isbn)


@router.get("/export")
def export_my_books(
    format: str = Query("csv", pattern="^(csv|json)$"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download the whole shelf as CSV or JSON (the same format the file import accepts)."""
    rows = library_service.export_rows(db, user.id)
    filename = f"bookshire-shelf-{date.today().isoformat()}.{format}"
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    if format == "json":
        return JSONResponse({"books": rows}, headers=headers)
    return Response(library_service.export_csv(rows), media_type="text/csv; charset=utf-8", headers=headers)


@router.post("/import-file", response_model=ShelfImportOut)
def import_my_books(
    payload: ShelfImportIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add or update shelf books from a CSV or JSON file (see export for the columns)."""
    rows = library_service.parse_import(payload.format, payload.content)
    return library_service.import_rows(db, user.id, rows)


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
