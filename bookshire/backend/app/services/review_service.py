from typing import List
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.book import Book, Edition
from app.models.review import Review
from app.models.user import User
from app.repositories import review_repo
from app.schemas.review import ReviewCreate, ReviewUpdate


def _ensure_book_exists(db: Session, book_id: UUID) -> None:
    exists = db.query(Book.id).filter(Book.id == book_id).first()
    if not exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")


def _ensure_user_exists(db: Session, user_id: UUID) -> None:
    exists = db.query(User.id).filter(User.id == user_id).first()
    if not exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")


def _ensure_edition_matches_book(db: Session, edition_id: UUID, book_id: UUID) -> None:
    exists = (
        db.query(Edition.id)
        .filter(
            Edition.id == edition_id,
            Edition.book_id == book_id,
        )
        .first()
    )
    if not exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Edition does not belong to this book",
        )


def list_book_reviews(db: Session, book_id: UUID, skip: int = 0, limit: int = 50) -> List[Review]:
    _ensure_book_exists(db, book_id)
    return review_repo.list_reviews_by_book(
        db,
        book_id=book_id,
        skip=skip,
        limit=limit,
    )


def list_user_reviews(db: Session, user_id: UUID, skip: int = 0, limit: int = 50) -> List[Review]:
    _ensure_user_exists(db, user_id)
    return review_repo.list_reviews_by_user(
        db,
        user_id=user_id,
        skip=skip,
        limit=limit,
    )


def create_book_review(db: Session, book_id: UUID, payload: ReviewCreate) -> Review:
    _ensure_book_exists(db, book_id)
    _ensure_user_exists(db, payload.user_id)

    if payload.edition_id:
        _ensure_edition_matches_book(db, payload.edition_id, book_id)

    existing = review_repo.get_active_review_by_user_and_book(
        db,
        user_id=payload.user_id,
        book_id=book_id,
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already reviewed this book",
        )

    review = Review(
        user_id=payload.user_id,
        book_id=book_id,
        edition_id=payload.edition_id,
        rating=payload.rating,
        content=payload.content.strip() if payload.content else None,
        visibility=payload.visibility,
    )
    return review_repo.create_review(db, review)


def update_review(db: Session, review_id: UUID, payload: ReviewUpdate) -> Review:
    review = review_repo.get_review_by_id(db, review_id)
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    values = payload.model_dump(exclude_unset=True)
    if "content" in values and values["content"] is not None:
        values["content"] = values["content"].strip()

    next_rating = values.get("rating", review.rating)
    next_content = values.get("content", review.content)
    if next_rating is None and not (next_content and next_content.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="rating or non-empty content is required",
        )

    return review_repo.update_review(db, review, values)


def remove_review(db: Session, review_id: UUID) -> Review:
    review = review_repo.get_review_by_id(db, review_id)
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    return review_repo.soft_delete_review(db, review)
