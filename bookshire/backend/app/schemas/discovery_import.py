from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator


class DiscoveryBookImport(BaseModel):
    """A book from the home page's discovery shelves (Google Books / Open Library)."""

    source: Literal["google_books", "open_library"]
    external_id: str = Field(min_length=1, max_length=200)
    title: str = Field(min_length=1, max_length=500)
    authors: List[str] = Field(default_factory=list, max_length=10)
    cover_url: Optional[str] = Field(default=None, max_length=1000)
    language: Optional[str] = Field(default=None, max_length=10)
    published_date: Optional[str] = Field(default=None, max_length=20)

    @field_validator("authors")
    @classmethod
    def clean_authors(cls, authors: List[str]) -> List[str]:
        cleaned = [a.strip()[:200] for a in authors if a and a.strip()]
        return list(dict.fromkeys(cleaned))

    @field_validator("cover_url")
    @classmethod
    def https_cover_only(cls, url: Optional[str]) -> Optional[str]:
        # Local placeholders and non-https links are not worth storing.
        if not url or not url.startswith("https://"):
            return None
        return url
