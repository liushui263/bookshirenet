from datetime import date, datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class UserBookCreate(BaseModel):
    edition_id: UUID
    status: str = Field(default="unread")
    condition: Optional[int] = Field(default=None, ge=1, le=5)
    location_text: Optional[str] = None
    exchangeable: bool = False
    visibility: str = "private"
    personal_tags: List[str] = []
    personal_notes_summary: Optional[str] = None
    acquired_at: Optional[date] = None
    started_at: Optional[date] = None
    finished_at: Optional[date] = None


class UserBookUpdate(BaseModel):
    status: Optional[str] = None
    condition: Optional[int] = Field(default=None, ge=1, le=5)
    location_text: Optional[str] = None
    exchangeable: Optional[bool] = None
    visibility: Optional[str] = None
    personal_tags: Optional[List[str]] = None
    personal_notes_summary: Optional[str] = None
    acquired_at: Optional[date] = None
    started_at: Optional[date] = None
    finished_at: Optional[date] = None


class UserBookOut(BaseModel):
    id: UUID
    user_id: UUID
    edition_id: UUID
    status: str
    condition: Optional[int] = None
    location_text: Optional[str] = None
    exchangeable: bool
    visibility: str
    personal_tags: List[str]
    personal_notes_summary: Optional[str] = None
    acquired_at: Optional[date] = None
    started_at: Optional[date] = None
    finished_at: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserBookShelfOut(UserBookOut):
    book_id: UUID
    book_title: str
    book_subtitle: Optional[str] = None
    book_cover_url: Optional[str] = None
    book_tags: List[str] = []
    book_categories: List[str] = []

    edition_title: Optional[str] = None
    edition_language: Optional[str] = None
    edition_cover_url: Optional[str] = None


class AddByIsbnIn(BaseModel):
    isbn: str = Field(min_length=1, max_length=40)


class ShelfImportIn(BaseModel):
    format: Literal["csv", "json"]
    content: str = Field(min_length=1, max_length=2_000_000)


class ShelfImportError(BaseModel):
    row: int
    title: Optional[str] = None
    error: str


class ShelfImportOut(BaseModel):
    added: int
    updated: int
    failed: int
    errors: List[ShelfImportError]
