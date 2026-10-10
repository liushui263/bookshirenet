from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class ReviewCreate(BaseModel):
    user_id: UUID
    edition_id: Optional[UUID] = None
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    content: Optional[str] = None
    visibility: str = Field(default="public", pattern="^(private|friends|public)$")

    @model_validator(mode="after")
    def require_rating_or_content(self):
        if self.rating is None and not (self.content and self.content.strip()):
            raise ValueError("rating or non-empty content is required")
        return self


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    content: Optional[str] = None
    visibility: Optional[str] = Field(default=None, pattern="^(private|friends|public)$")

    @model_validator(mode="after")
    def require_rating_or_content_if_both_present_empty(self):
        if self.rating is None and self.content is not None and not self.content.strip():
            raise ValueError("content cannot be empty unless rating is provided")
        return self


class ReviewOut(BaseModel):
    id: UUID
    user_id: UUID
    book_id: UUID
    edition_id: Optional[UUID] = None
    rating: Optional[int] = None
    content: Optional[str] = None
    visibility: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True