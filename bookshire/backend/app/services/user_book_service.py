from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.user_book import UserBook
from app.repositories import user_book_repo
from app.schemas.user_book import UserBookCreate, UserBookUpdate


VALID_STATUSES = {"unread", "reading", "read", "abandoned"}
VALID_VISIBILITY = {"private", "friends", "public"}


def _validate_status(status: str | None):
    if status is not None and status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {sorted(VALID_STATUSES)}",
        )


def _validate_visibility(visibility: str | None):
    if visibility is not None and visibility not in VALID_VISIBILITY:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid visibility. Must be one of: {sorted(VALID_VISIBILITY)}",
        )


def list_user_books(db: Session, user_id: UUID):
    return user_book_repo.list_user_books(db, user_id)


def add_user_book(db: Session, user_id: UUID, payload: UserBookCreate):
    _validate_status(payload.status)
    _validate_visibility(payload.visibility)

    user_book = UserBook(
        user_id=user_id,
        edition_id=payload.edition_id,
        status=payload.status,
        condition=payload.condition,
        location_text=payload.location_text,
        exchangeable=payload.exchangeable,
        visibility=payload.visibility,
        personal_tags=payload.personal_tags,
        personal_notes_summary=payload.personal_notes_summary,
        acquired_at=payload.acquired_at,
        started_at=payload.started_at,
        finished_at=payload.finished_at,
    )

    try:
        created = user_book_repo.create_user_book(db, user_book)
        shelf_item = user_book_repo.get_user_book_shelf_item(db, user_id, created.id)
        return shelf_item or created
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="This edition is already in the user's shelf or referenced data does not exist.",
        ) from exc


def update_user_book(db: Session, user_id: UUID, user_book_id: UUID, payload: UserBookUpdate):
    user_book = user_book_repo.get_user_book(db, user_id, user_book_id)
    if not user_book:
        raise HTTPException(status_code=404, detail="User book not found")

    data = payload.model_dump(exclude_unset=True)

    _validate_status(data.get("status"))
    _validate_visibility(data.get("visibility"))

    updated = user_book_repo.update_user_book(db, user_book, data)
    shelf_item = user_book_repo.get_user_book_shelf_item(db, user_id, updated.id)
    return shelf_item or updated


def remove_user_book(db: Session, user_id: UUID, user_book_id: UUID):
    user_book = user_book_repo.get_user_book(db, user_id, user_book_id)
    if not user_book:
        raise HTTPException(status_code=404, detail="User book not found")

    return user_book_repo.soft_delete_user_book(db, user_book)


def add_user_book_by_book_id(db: Session, user_id: UUID, book_id: UUID, status: str = "unread"):
    from app.models.book import Book, Edition

    _validate_status(status)

    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    edition = user_book_repo.get_first_edition_by_book_id(db, book_id)

    if not edition:
        edition = Edition(
            book_id=book.id,
            title=book.title,
            subtitle=book.subtitle,
            language=book.original_language or "unknown",
            format="unknown",
        )
        db.add(edition)
        db.commit()
        db.refresh(edition)

    existing = user_book_repo.get_existing_user_book_by_edition(
        db, user_id, edition.id
    )
    if existing:
        shelf_item = user_book_repo.get_user_book_shelf_item(db, user_id, existing.id)
        return shelf_item or existing

    user_book = UserBook(
        user_id=user_id,
        edition_id=edition.id,
        status=status,
        visibility="private",
        exchangeable=False,
        personal_tags=[],
    )

    try:
        created = user_book_repo.create_user_book(db, user_book)
        shelf_item = user_book_repo.get_user_book_shelf_item(db, user_id, created.id)
        return shelf_item or created
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="This book is already in the user's shelf or referenced data does not exist.",
        ) from exc
