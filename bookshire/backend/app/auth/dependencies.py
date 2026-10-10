from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.auth.tokens import decode_access_token
from app.db.session import get_db
from app.models.user import User

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not signed in",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized

    user_id = decode_access_token(credentials.credentials)
    if user_id is None:
        raise unauthorized

    user = (
        db.query(User)
        .filter(User.id == user_id, User.deleted_at.is_(None), User.status == "active")
        .first()
    )
    if user is None:
        raise unauthorized
    return user
