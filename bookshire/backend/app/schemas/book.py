from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class BookCreate(BaseModel):
    title: str
    subtitle: Optional[str] = None
    original_language: Optional[str] = None
    canonical_cover_url: Optional[str] = None
    canonical_description: Optional[str] = None
    canonical_description_language: Optional[str] = None
    categories: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)

    edition_language: str = "en"
    isbn_10: Optional[str] = None
    isbn_13: Optional[str] = None
    publisher: Optional[str] = None
    publication_year: Optional[int] = None
    format: str = "unknown"
    cover_url: Optional[str] = None


class BookOut(BaseModel):
    id: UUID
    title: str
    subtitle: Optional[str] = None
    normalized_title: Optional[str] = None
    original_language: Optional[str] = None
    canonical_cover_url: Optional[str] = None
    canonical_description: Optional[str] = None
    avg_rating: Optional[float] = None
    rating_avg: Optional[float] = None
    rating_count: Optional[int] = None
    categories: List[str] = []
    tags: List[str] = []

    class Config:
        from_attributes = True


class UserBookCreate(BaseModel):
    user_id: UUID
    edition_id: UUID
    status: str = "unread"
    condition: Optional[int] = Field(default=None, ge=1, le=5)
    location_text: Optional[str] = None
    exchangeable: bool = False
    visibility: str = "private"


class UserBookOut(BaseModel):
    id: UUID
    user_id: UUID
    edition_id: UUID
    status: str
    condition: Optional[int] = None
    location_text: Optional[str] = None
    exchangeable: bool
    visibility: str

    class Config:
        from_attributes = True