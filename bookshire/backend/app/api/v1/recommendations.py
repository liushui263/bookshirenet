from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.recommendation_service import recommend_books

router = APIRouter()

@router.get("/")
def get_recommendations(user_id: str, db: Session = Depends(get_db)):
    return recommend_books(db, user_id)