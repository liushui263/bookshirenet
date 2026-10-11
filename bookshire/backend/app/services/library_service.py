"""Adding books by ISBN and exporting / importing a whole shelf."""

import csv
import io
import json
from datetime import date
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.book import Book, Edition
from app.models.user_book import UserBook
from app.repositories import user_book_repo
from app.services.discovery_import_service import attach_authors
from app.services.isbn_lookup import lookup_isbn, normalize_isbn

MAX_IMPORT_ROWS = 500
# Each new ISBN costs up to two web requests, so cap them to keep an import request short.
MAX_ISBN_LOOKUPS = 25

# Column order for CSV export; import accepts the same names (and a few aliases).
EXPORT_FIELDS = [
    "title",
    "subtitle",
    "authors",
    "isbn_13",
    "isbn_10",
    "language",
    "publisher",
    "publication_year",
    "status",
    "condition",
    "visibility",
    "exchangeable",
    "location",
    "tags",
    "notes",
    "acquired_at",
    "started_at",
    "finished_at",
    "book_id",
]

_FIELD_ALIASES = {
    "isbn": "isbn",
    "isbn13": "isbn_13",
    "isbn10": "isbn_10",
    "author": "authors",
    "personal_notes_summary": "notes",
    "personal_tags": "tags",
    "location_text": "location",
}

VALID_STATUSES = {"unread", "reading", "read", "abandoned"}
VALID_VISIBILITY = {"private", "friends", "public"}
_STATUS_ALIASES = {"want_to_read": "unread", "to_read": "unread", "finished": "read", "done": "read"}


# ---------------------------------------------------------------- catalog


def _find_edition_by_isbn(db: Session, isbn13: str, isbn10: str | None) -> Edition | None:
    query = db.query(Edition).filter(Edition.isbn_13 == isbn13)
    edition = query.first()
    if edition is None and isbn10:
        edition = db.query(Edition).filter(Edition.isbn_10 == isbn10).first()
    return edition


def _create_book_and_edition(
    db: Session,
    *,
    title: str,
    subtitle: str | None,
    authors: list[str],
    language: str | None,
    cover_url: str | None,
    publisher: str | None,
    publication_year: int | None,
    page_count: int | None,
    source: str,
    external_ids: dict,
    isbn13: str | None,
    isbn10: str | None,
) -> Edition:
    language = (language or "").strip()[:10] or None
    book = Book(
        title=title.strip()[:500],
        subtitle=subtitle,
        original_language=language,
        canonical_cover_url=cover_url,
        metadata_source=source,
        external_ids=external_ids,
    )
    db.add(book)
    db.flush()
    edition = Edition(
        book_id=book.id,
        title=book.title,
        subtitle=subtitle,
        language=language or "unknown",
        isbn_13=isbn13,
        isbn_10=isbn10,
        publisher=publisher,
        publication_year=publication_year,
        page_count=page_count,
        cover_url=cover_url,
        format="unknown",
        metadata_source=source,
        external_ids=external_ids,
    )
    db.add(edition)
    db.flush()
    attach_authors(db, book.id, authors)
    return edition


def find_or_create_edition_by_isbn(db: Session, raw_isbn: str, *, allow_lookup: bool = True) -> Edition | None:
    """Find an edition by ISBN, or create it from Google Books / Open Library.

    Returns None when the ISBN is unknown everywhere. Raises 400 for an invalid ISBN.
    """
    parsed = normalize_isbn(raw_isbn)
    if parsed is None:
        raise HTTPException(status_code=400, detail="That doesn't look like a valid ISBN.")
    isbn13, isbn10 = parsed

    edition = _find_edition_by_isbn(db, isbn13, isbn10)
    if edition or not allow_lookup:
        return edition

    meta = lookup_isbn(isbn13)
    if meta is None:
        return None

    edition = _create_book_and_edition(
        db,
        title=meta.title,
        subtitle=meta.subtitle,
        authors=meta.authors,
        language=meta.language,
        cover_url=meta.cover_url,
        publisher=meta.publisher,
        publication_year=meta.publication_year,
        page_count=meta.page_count,
        source=meta.source,
        external_ids=meta.external_ids,
        isbn13=isbn13,
        isbn10=isbn10,
    )
    try:
        db.commit()
    except IntegrityError:
        # Someone else added the same ISBN at the same moment.
        db.rollback()
        return _find_edition_by_isbn(db, isbn13, isbn10)
    db.refresh(edition)
    return edition


# ---------------------------------------------------------------- shelf


def add_edition_to_shelf(db: Session, user_id: UUID, edition_id: UUID, fields: dict | None = None):
    """Put an edition on the user's shelf (or update the copy already there)."""
    fields = fields or {}
    existing = user_book_repo.get_existing_user_book_by_edition(db, user_id, edition_id)
    if existing:
        if fields:
            user_book_repo.update_user_book(db, existing, fields)
        return user_book_repo.get_user_book_shelf_item(db, user_id, existing.id), False

    user_book = UserBook(
        user_id=user_id,
        edition_id=edition_id,
        status=fields.get("status", "unread"),
        visibility=fields.get("visibility", "private"),
        exchangeable=fields.get("exchangeable", False),
        personal_tags=fields.get("personal_tags", []),
        condition=fields.get("condition"),
        location_text=fields.get("location_text"),
        personal_notes_summary=fields.get("personal_notes_summary"),
        acquired_at=fields.get("acquired_at"),
        started_at=fields.get("started_at"),
        finished_at=fields.get("finished_at"),
    )
    try:
        created = user_book_repo.create_user_book(db, user_book)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="This book is already on your shelf.") from exc
    return user_book_repo.get_user_book_shelf_item(db, user_id, created.id), True


def add_by_isbn(db: Session, user_id: UUID, raw_isbn: str):
    edition = find_or_create_edition_by_isbn(db, raw_isbn)
    if edition is None:
        raise HTTPException(
            status_code=404,
            detail="No book found for that ISBN. Check the number, or add the book by importing a file with its title.",
        )
    item, _ = add_edition_to_shelf(db, user_id, edition.id)
    return item


# ---------------------------------------------------------------- export


def authors_by_book(db: Session, book_ids: list[UUID]) -> dict[UUID, list[str]]:
    if not book_ids:
        return {}
    rows = db.execute(
        text(
            """
            SELECT bc.book_id, c.name
            FROM book_contributors bc JOIN contributors c ON c.id = bc.contributor_id
            WHERE bc.book_id = ANY(:ids) AND bc.role = 'author'
            ORDER BY bc.book_id, bc.sort_order
            """
        ),
        {"ids": book_ids},
    ).all()
    result: dict[UUID, list[str]] = {}
    for book_id, name in rows:
        result.setdefault(book_id, []).append(name)
    return result


def export_rows(db: Session, user_id: UUID) -> list[dict]:
    rows = (
        db.query(UserBook, Edition, Book)
        .join(Edition, UserBook.edition_id == Edition.id)
        .join(Book, Edition.book_id == Book.id)
        .filter(UserBook.user_id == user_id)
        .filter(UserBook.deleted_at.is_(None))
        .order_by(UserBook.created_at.asc())
        .all()
    )
    authors = authors_by_book(db, list({book.id for _, _, book in rows}))
    out = []
    for user_book, edition, book in rows:
        out.append(
            {
                "title": book.title,
                "subtitle": book.subtitle or edition.subtitle,
                "authors": authors.get(book.id, []),
                "isbn_13": edition.isbn_13,
                "isbn_10": edition.isbn_10,
                "language": edition.language if edition.language != "unknown" else None,
                "publisher": edition.publisher,
                "publication_year": edition.publication_year,
                "status": user_book.status,
                "condition": user_book.condition,
                "visibility": user_book.visibility,
                "exchangeable": user_book.exchangeable,
                "location": user_book.location_text,
                "tags": list(user_book.personal_tags or []),
                "notes": user_book.personal_notes_summary,
                "acquired_at": user_book.acquired_at.isoformat() if user_book.acquired_at else None,
                "started_at": user_book.started_at.isoformat() if user_book.started_at else None,
                "finished_at": user_book.finished_at.isoformat() if user_book.finished_at else None,
                "book_id": str(book.id),
            }
        )
    return out


def export_csv(rows: list[dict]) -> str:
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=EXPORT_FIELDS)
    writer.writeheader()
    for row in rows:
        flat = dict(row)
        flat["authors"] = "; ".join(row["authors"])
        flat["tags"] = "; ".join(row["tags"])
        flat["exchangeable"] = "yes" if row["exchangeable"] else "no"
        writer.writerow({k: ("" if v is None else v) for k, v in flat.items()})
    # A BOM lets Excel open the file as UTF-8 (titles in Chinese, Russian, ...).
    return "﻿" + buffer.getvalue()


# ---------------------------------------------------------------- import


class RowError(Exception):
    pass


def _split_list(value) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        items = value
    else:
        items = str(value).replace("|", ";").split(";")
    return list(dict.fromkeys(str(item).strip() for item in items if str(item).strip()))


def _text(value, limit: int) -> str | None:
    if value is None:
        return None
    value = str(value).strip()
    return value[:limit] or None


def _date(value, name: str) -> date | None:
    value = _text(value, 40)
    if not value:
        return None
    try:
        return date.fromisoformat(value[:10])
    except ValueError as exc:
        raise RowError(f"{name} must be a date like 2024-05-31") from exc


def _bool(value) -> bool:
    return str(value).strip().lower() in {"1", "true", "yes", "y"}


def _shelf_fields(row: dict) -> dict:
    """Shelf fields present in the row (absent columns leave existing values alone)."""
    fields: dict = {}
    if _text(row.get("status"), 40):
        status = row["status"].strip().lower().replace(" ", "_")
        status = _STATUS_ALIASES.get(status, status)
        if status not in VALID_STATUSES:
            raise RowError(f"status must be one of {', '.join(sorted(VALID_STATUSES))}")
        fields["status"] = status
    if _text(row.get("condition"), 10):
        try:
            condition = int(float(str(row["condition"]).strip()))
        except ValueError as exc:
            raise RowError("condition must be a number from 1 to 5") from exc
        if not 1 <= condition <= 5:
            raise RowError("condition must be a number from 1 to 5")
        fields["condition"] = condition
    if _text(row.get("visibility"), 20):
        visibility = row["visibility"].strip().lower()
        if visibility not in VALID_VISIBILITY:
            raise RowError(f"visibility must be one of {', '.join(sorted(VALID_VISIBILITY))}")
        fields["visibility"] = visibility
    if row.get("exchangeable") not in (None, ""):
        fields["exchangeable"] = _bool(row["exchangeable"])
    if "location" in row and row["location"] not in (None, ""):
        fields["location_text"] = _text(row["location"], 300)
    if "tags" in row and row["tags"] not in (None, ""):
        fields["personal_tags"] = [t[:60] for t in _split_list(row["tags"])][:30]
    if "notes" in row and row["notes"] not in (None, ""):
        fields["personal_notes_summary"] = _text(row["notes"], 5000)
    for name in ("acquired_at", "started_at", "finished_at"):
        parsed = _date(row.get(name), name)
        if parsed:
            fields[name] = parsed
    if fields.get("started_at") and fields.get("finished_at") and fields["started_at"] > fields["finished_at"]:
        raise RowError("started_at must not be after finished_at")
    return fields


def _find_book_by_title(db: Session, title: str, first_author: str | None) -> Book | None:
    sql = "SELECT b.id FROM books b WHERE lower(b.title) = lower(:title)"
    params = {"title": title}
    if first_author:
        sql += (
            " AND EXISTS (SELECT 1 FROM book_contributors bc JOIN contributors c ON c.id = bc.contributor_id"
            " WHERE bc.book_id = b.id AND lower(c.name) = lower(:author))"
        )
        params["author"] = first_author
    book_id = db.execute(text(sql + " ORDER BY b.created_at LIMIT 1"), params).scalar()
    return db.get(Book, book_id) if book_id else None


def _resolve_edition(db: Session, row: dict, lookups_left: list[int]) -> Edition:
    book_id = _text(row.get("book_id"), 40)
    if book_id:
        try:
            edition = user_book_repo.get_first_edition_by_book_id(db, UUID(book_id))
        except ValueError:
            edition = None
        if edition:
            return edition

    title = _text(row.get("title"), 500)
    authors = [a[:200] for a in _split_list(row.get("authors"))][:10]
    raw_isbn = _text(row.get("isbn_13") or row.get("isbn") or row.get("isbn_10"), 40)
    isbn13 = isbn10 = None
    allow_lookup = False
    if raw_isbn:
        parsed = normalize_isbn(raw_isbn)
        if parsed is None:
            raise RowError(f"'{raw_isbn}' is not a valid ISBN")
        isbn13, isbn10 = parsed
        allow_lookup = lookups_left[0] > 0
        if allow_lookup:
            lookups_left[0] -= 1
        edition = find_or_create_edition_by_isbn(db, isbn13, allow_lookup=allow_lookup)
        if edition:
            return edition

    if not title:
        if raw_isbn and not allow_lookup:
            raise RowError(
                f"only {MAX_ISBN_LOOKUPS} new ISBNs are looked up per file; import the rest in another file"
            )
        if raw_isbn:
            raise RowError("no book found for this ISBN; add a title column to import it anyway")
        raise RowError("each row needs a title or an ISBN")

    try:
        year = int(str(row.get("publication_year")).strip()[:4]) if row.get("publication_year") else None
    except ValueError:
        year = None

    book = _find_book_by_title(db, title, authors[0] if authors else None)
    if book:
        if isbn13:
            # Same book, but this ISBN is a different edition: record it so the ISBN finds it later.
            edition = Edition(
                book_id=book.id,
                title=book.title,
                language=_text(row.get("language"), 10) or book.original_language or "unknown",
                isbn_13=isbn13,
                isbn_10=isbn10,
                publisher=_text(row.get("publisher"), 300),
                publication_year=year,
                format="unknown",
                metadata_source="import",
            )
            db.add(edition)
            db.commit()
            db.refresh(edition)
            return edition
        edition = user_book_repo.get_first_edition_by_book_id(db, book.id)
        if edition:
            return edition
    edition = _create_book_and_edition(
        db,
        title=title,
        subtitle=_text(row.get("subtitle"), 500),
        authors=authors,
        language=_text(row.get("language"), 10),
        cover_url=None,
        publisher=_text(row.get("publisher"), 300),
        publication_year=year,
        page_count=None,
        source="import",
        external_ids={},
        isbn13=isbn13,
        isbn10=isbn10,
    )
    db.commit()
    db.refresh(edition)
    return edition


def _normalize_keys(row: dict) -> dict:
    out = {}
    for key, value in row.items():
        if key is None:
            continue
        name = str(key).strip().lstrip("﻿").lower().replace(" ", "_")
        out[_FIELD_ALIASES.get(name, name)] = value
    return out


def parse_import(fmt: str, content: str) -> list[dict]:
    if fmt == "json":
        try:
            data = json.loads(content)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="The file isn't valid JSON.") from exc
        if isinstance(data, dict):
            data = data.get("books", [])
        if not isinstance(data, list) or not all(isinstance(r, dict) for r in data):
            raise HTTPException(status_code=400, detail="The JSON file should be a list of books.")
        rows = data
    else:
        reader = csv.DictReader(io.StringIO(content.lstrip("﻿")))
        rows = list(reader)
    if len(rows) > MAX_IMPORT_ROWS:
        raise HTTPException(
            status_code=400,
            detail=f"Files can have up to {MAX_IMPORT_ROWS} books; split it into smaller files.",
        )
    return [_normalize_keys(row) for row in rows]


def import_rows(db: Session, user_id: UUID, rows: list[dict], max_lookups: int = MAX_ISBN_LOOKUPS) -> dict:
    added = updated = 0
    errors = []
    lookups_left = [max_lookups]
    for index, row in enumerate(rows, start=1):
        try:
            fields = _shelf_fields(row)
            edition = _resolve_edition(db, row, lookups_left)
            _, created = add_edition_to_shelf(db, user_id, edition.id, fields)
            if created:
                added += 1
            else:
                updated += 1
        except RowError as exc:
            db.rollback()
            errors.append({"row": index, "title": _text(row.get("title"), 200), "error": str(exc)})
        except HTTPException as exc:
            db.rollback()
            errors.append({"row": index, "title": _text(row.get("title"), 200), "error": str(exc.detail)})
    return {"added": added, "updated": updated, "failed": len(errors), "errors": errors[:50]}
