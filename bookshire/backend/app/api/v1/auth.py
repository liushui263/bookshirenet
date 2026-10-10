from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.passwords import hash_password, verify_password
from app.auth.tokens import create_access_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import AuthOut, LoginIn, RegisterIn, UserMe

router = APIRouter(prefix="/auth", tags=["auth"])


def _auth_response(user: User) -> AuthOut:
    return AuthOut(access_token=create_access_token(user.id), user=UserMe.model_validate(user))


@router.post("/register", response_model=AuthOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    taken = HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists")

    if db.query(User.id).filter(func.lower(User.email) == email).first():
        raise taken

    user = User(
        email=email,
        display_name=payload.display_name.strip(),
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise taken from exc
    db.refresh(user)
    return _auth_response(user)


@router.post("/login", response_model=AuthOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = (
        db.query(User)
        .filter(func.lower(User.email) == email, User.deleted_at.is_(None), User.status == "active")
        .first()
    )
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Wrong email or password")
    return _auth_response(user)


@router.get("/me", response_model=UserMe)
def me(user: User = Depends(get_current_user)):
    return user
