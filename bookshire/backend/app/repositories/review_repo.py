from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.review import Review


def get_review_by_id(db: Session, review_id: UUID) -> Optional[Review]:
    return (
        db.query(Review)
        .filter(
            Review.id == review_id,
            Review.deleted_at.is_(None),
        )
        .first()
    )


def get_active_review_by_user_and_book(db: Session, user_id: UUID, book_id: UUID) -> Optional[Review]:
    return (
        db.query(Review)
        .filter(
            Review.user_id == user_id,
            Review.book_id == book_id,
            Review.deleted_at.is_(None),
        )
        .first()
    )


def list_reviews_by_book(db: Session, book_id: UUID, skip: int = 0, limit: int = 50) -> List[Review]:
    return (
        db.query(Review)
        .filter(
            Review.book_id == book_id,
            Review.deleted_at.is_(None),
            Review.visibility == "public",
        )
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def list_reviews_by_user(db: Session, user_id: UUID, skip: int = 0, limit: int = 50) -> List[Review]:
    return (
        db.query(Review)
        .filter(
            Review.user_id == user_id,
            Review.deleted_at.is_(None),
        )
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_review(db: Session, review: Review) -> Review:
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


def update_review(db: Session, review: Review, values: dict) -> Review:
    for key, value in values.items():
        setattr(review, key, value)

    db.commit()
    db.refresh(review)
    return review


def soft_delete_review(db: Session, review: Review) -> Review:
    review.deleted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(review)
    return review