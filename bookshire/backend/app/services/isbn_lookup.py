"""ISBN parsing and metadata lookup (Google Books, then Open Library)."""

import json
import logging
import re
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field

from app.core.config import settings

logger = logging.getLogger(__name__)

_TIMEOUT_SECONDS = 4


def _isbn10_check_ok(isbn: str) -> bool:
    total = 0
    for i, ch in enumerate(isbn):
        value = 10 if ch == "X" else int(ch)
        total += (10 - i) * value
    return total % 11 == 0


def _isbn13_check_digit(first12: str) -> str:
    total = sum(int(d) * (1 if i % 2 == 0 else 3) for i, d in enumerate(first12))
    return str((10 - total % 10) % 10)


def normalize_isbn(raw: str) -> tuple[str, str | None] | None:
    """Return (isbn_13, isbn_10 or None) for a valid ISBN, else None.

    Accepts hyphens and spaces. ISBN-10s are converted to ISBN-13 (978 prefix).
    """
    isbn = re.sub(r"[\s-]", "", raw or "").upper()
    if re.fullmatch(r"\d{9}[\dX]", isbn):
        if not _isbn10_check_ok(isbn):
            return None
        first12 = "978" + isbn[:9]
        return first12 + _isbn13_check_digit(first12), isbn
    if re.fullmatch(r"\d{13}", isbn) and isbn[:3] in ("978", "979"):
        if _isbn13_check_digit(isbn[:12]) != isbn[12]:
            return None
        isbn10 = None
        if isbn.startswith("978"):
            body = isbn[3:12]
            total = sum((10 - i) * int(d) for i, d in enumerate(body))
            check = (11 - total % 11) % 11
            isbn10 = body + ("X" if check == 10 else str(check))
        return isbn, isbn10
    return None


@dataclass
class IsbnMetadata:
    title: str
    source: str  # metadata_source enum value
    subtitle: str | None = None
    authors: list[str] = field(default_factory=list)
    publisher: str | None = None
    publication_year: int | None = None
    language: str | None = None
    cover_url: str | None = None
    page_count: int | None = None
    external_ids: dict = field(default_factory=dict)


def _get_json(url: str) -> dict | None:
    request = urllib.request.Request(url, headers={"User-Agent": "BookShire/1.0 (+https://bookshire.net)"})
    try:
        with urllib.request.urlopen(request, timeout=_TIMEOUT_SECONDS) as response:
            return json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, ValueError) as exc:
        logger.warning("ISBN lookup request failed: %s (%s)", url.split("?")[0], exc)
        return None


def _year(value) -> int | None:
    match = re.search(r"\d{4}", str(value or ""))
    return int(match.group(0)) if match else None


def _https(url: str | None) -> str | None:
    if not url:
        return None
    if url.startswith("http://"):
        url = "https://" + url[len("http://"):]
    return url if url.startswith("https://") else None


def parse_google_books(data: dict | None) -> IsbnMetadata | None:
    items = (data or {}).get("items") or []
    if not items:
        return None
    item = items[0]
    info = item.get("volumeInfo") or {}
    if not info.get("title"):
        return None
    images = info.get("imageLinks") or {}
    return IsbnMetadata(
        title=info["title"],
        subtitle=info.get("subtitle"),
        authors=[a for a in info.get("authors") or [] if a][:10],
        publisher=info.get("publisher"),
        publication_year=_year(info.get("publishedDate")),
        language=(info.get("language") or None),
        cover_url=_https(images.get("thumbnail") or images.get("smallThumbnail")),
        page_count=info.get("pageCount") or None,
        source="google_books",
        external_ids={"google_books_id": item["id"]} if item.get("id") else {},
    )


def parse_open_library(data: dict | None, isbn13: str) -> IsbnMetadata | None:
    record = (data or {}).get(f"ISBN:{isbn13}")
    if not record or not record.get("title"):
        return None
    cover = record.get("cover") or {}
    publishers = record.get("publishers") or []
    external_ids = {}
    key = record.get("key")
    if key:
        external_ids["open_library_key"] = key
    return IsbnMetadata(
        title=record["title"],
        subtitle=record.get("subtitle"),
        authors=[a.get("name") for a in record.get("authors") or [] if a.get("name")][:10],
        publisher=publishers[0].get("name") if publishers else None,
        publication_year=_year(record.get("publish_date")),
        cover_url=_https(cover.get("medium") or cover.get("large") or cover.get("small")),
        page_count=record.get("number_of_pages") or None,
        source="open_library",
        external_ids=external_ids,
    )


def lookup_isbn(isbn13: str) -> IsbnMetadata | None:
    params = {"q": f"isbn:{isbn13}", "maxResults": "1"}
    if settings.GOOGLE_BOOKS_API_KEY:
        params["key"] = settings.GOOGLE_BOOKS_API_KEY
    found = parse_google_books(
        _get_json("https://www.googleapis.com/books/v1/volumes?" + urllib.parse.urlencode(params))
    )
    if found:
        return found
    return parse_open_library(
        _get_json(
            "https://openlibrary.org/api/books?"
            + urllib.parse.urlencode({"bibkeys": f"ISBN:{isbn13}", "format": "json", "jscmd": "data"})
        ),
        isbn13,
    )
