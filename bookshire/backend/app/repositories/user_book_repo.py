from uuid import UUID

from sqlalchemy.orm import Session

from app.models.book import Book, Edition
from app.models.user_book import UserBook


def _shelf_item(user_book: UserBook, edition: Edition, book: Book, authors: list[str]) -> dict:
    return {
        "id": user_book.id,
        "user_id": user_book.user_id,
        "edition_id": user_book.edition_id,
        "status": user_book.status,
        "condition": user_book.condition,
        "location_text": user_book.location_text,
        "exchangeable": user_book.exchangeable,
        "visibility": user_book.visibility,
        "personal_tags": user_book.personal_tags or [],
        "personal_notes_summary": user_book.personal_notes_summary,
        "acquired_at": user_book.acquired_at,
        "started_at": user_book.started_at,
        "finished_at": user_book.finished_at,
        "created_at": user_book.created_at,
        "updated_at": user_book.updated_at,
        "book_id": book.id,
        "book_title": book.title,
        "book_subtitle": book.subtitle,
        "book_cover_url": edition.cover_url or book.canonical_cover_url,
        "book_tags": book.tags or [],
        "book_categories": book.categories or [],
        "book_authors": authors,
        "book_description": book.canonical_description,
        "edition_title": edition.title,
        "edition_language": edition.language,
        "edition_cover_url": edition.cover_url,
        "edition_publisher": edition.publisher,
        "edition_publication_year": edition.publication_year,
        "edition_isbn_13": edition.isbn_13,
        "edition_isbn_10": edition.isbn_10,
        "edition_page_count": edition.page_count,
    }


def list_user_books(db: Session, user_id: UUID):
    rows = (
        db.query(UserBook, Edition, Book)
        .join(Edition, UserBook.edition_id == Edition.id)
        .join(Book, Edition.book_id == Book.id)
        .filter(UserBook.user_id == user_id)
        .filter(UserBook.deleted_at.is_(None))
        .order_by(UserBook.created_at.desc())
        .all()
    )

    from app.services.library_service import authors_by_book

    authors = authors_by_book(db, list({book.id for _, _, book in rows}))
    result = [_shelf_item(user_book, edition, book, authors.get(book.id, [])) for user_book, edition, book in rows]
    return result


def get_user_book(db: Session, user_id: UUID, user_book_id: UUID):
    return (
        db.query(UserBook)
        .filter(UserBook.id == user_book_id)
        .filter(UserBook.user_id == user_id)
        .filter(UserBook.deleted_at.is_(None))
        .first()
    )


def create_user_book(db: Session, user_book: UserBook):
    db.add(user_book)
    db.commit()
    db.refresh(user_book)
    return user_book


def update_user_book(db: Session, user_book: UserBook, data: dict):
    for key, value in data.items():
        setattr(user_book, key, value)

    db.commit()
    db.refresh(user_book)
    return user_book


def soft_delete_user_book(db: Session, user_book: UserBook):
    from datetime import datetime, timezone

    user_book.deleted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user_book)
    return user_book


def get_existing_user_book_by_edition(db: Session, user_id: UUID, edition_id: UUID):
    return (
        db.query(UserBook)
        .filter(UserBook.user_id == user_id)
        .filter(UserBook.edition_id == edition_id)
        .filter(UserBook.deleted_at.is_(None))
        .first()
    )


def get_first_edition_by_book_id(db: Session, book_id: UUID):
    return (
        db.query(Edition)
        .filter(Edition.book_id == book_id)
        .order_by(Edition.created_at.asc() if hasattr(Edition, "created_at") else Edition.id.asc())
        .first()
    )


def get_user_book_shelf_item(db: Session, user_id: UUID, user_book_id: UUID):
    row = (
        db.query(UserBook, Edition, Book)
        .join(Edition, UserBook.edition_id == Edition.id)
        .join(Book, Edition.book_id == Book.id)
        .filter(UserBook.id == user_book_id)
        .filter(UserBook.user_id == user_id)
        .filter(UserBook.deleted_at.is_(None))
        .first()
    )

    if not row:
        return None

    from app.services.library_service import authors_by_book

    user_book, edition, book = row
    return _shelf_item(user_book, edition, book, authors_by_book(db, [book.id]).get(book.id, []))
