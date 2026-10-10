from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewOut, ReviewUpdate
from app.services import review_service


router = APIRouter(tags=["reviews"])


@router.get("/books/{book_id}/reviews", response_model=List[ReviewOut])
def get_book_reviews(
    book_id: UUID,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return review_service.list_book_reviews(
        db,
        book_id=book_id,
        skip=skip,
        limit=limit,
    )


@router.post(
    "/books/{book_id}/reviews",
    response_model=ReviewOut,
    status_code=status.HTTP_201_CREATED,
)
def create_book_review(
    book_id: UUID,
    payload: ReviewCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return review_service.create_book_review(db, book_id=book_id, user_id=user.id, payload=payload)


@router.get("/users/{user_id}/reviews", response_model=List[ReviewOut])
def get_user_reviews(
    user_id: UUID,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return review_service.list_user_reviews(
        db,
        user_id=user_id,
        skip=skip,
        limit=limit,
    )


@router.get("/me/reviews", response_model=List[ReviewOut])
def get_my_reviews(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return review_service.list_user_reviews(
        db,
        user_id=user.id,
        skip=skip,
        limit=limit,
        public_only=False,
    )


@router.patch("/reviews/{review_id}", response_model=ReviewOut)
def update_review(
    review_id: UUID,
    payload: ReviewUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return review_service.update_review(db, review_id=review_id, user_id=user.id, payload=payload)


@router.delete("/reviews/{review_id}", response_model=ReviewOut)
def delete_review(
    review_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return review_service.remove_review(db, review_id=review_id, user_id=user.id)
