import re

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.book import Book, Edition
from app.schemas.discovery_import import DiscoveryBookImport

# Key under books.external_ids / editions.external_ids for each source.
_EXTERNAL_ID_KEYS = {
    "google_books": "google_books_id",
    "open_library": "open_library_key",
}


def _publication_year(published_date: str | None) -> int | None:
    match = re.match(r"^(\d{4})", published_date or "")
    return int(match.group(1)) if match else None


def _attach_authors(db: Session, book_id, authors: list[str]) -> None:
    for sort_order, name in enumerate(authors):
        contributor_id = db.execute(
            text("SELECT id FROM contributors WHERE name = :name ORDER BY created_at LIMIT 1"),
            {"name": name},
        ).scalar()
        if contributor_id is None:
            contributor_id = db.execute(
                text("INSERT INTO contributors (name) VALUES (:name) RETURNING id"),
                {"name": name},
            ).scalar_one()
        db.execute(
            text(
                """
                INSERT INTO book_contributors (book_id, contributor_id, role, sort_order)
                VALUES (:book_id, :contributor_id, 'author', :sort_order)
                ON CONFLICT DO NOTHING
                """
            ),
            {"book_id": book_id, "contributor_id": contributor_id, "sort_order": sort_order},
        )


def find_or_create_book(db: Session, payload: DiscoveryBookImport) -> Book:
    key = _EXTERNAL_ID_KEYS[payload.source]

    existing = db.query(Book).filter(Book.external_ids[key].astext == payload.external_id).first()
    if existing:
        return existing

    external_ids = {key: payload.external_id}
    book = Book(
        title=payload.title.strip(),
        original_language=payload.language,
        canonical_cover_url=payload.cover_url,
        metadata_source=payload.source,
        external_ids=external_ids,
    )
    db.add(book)
    db.flush()

    db.add(
        Edition(
            book_id=book.id,
            title=book.title,
            language=payload.language or "unknown",
            publication_year=_publication_year(payload.published_date),
            cover_url=payload.cover_url,
            format="unknown",
            metadata_source=payload.source,
            external_ids=external_ids,
        )
    )
    _attach_authors(db, book.id, payload.authors)
    db.commit()
    db.refresh(book)
    return book
