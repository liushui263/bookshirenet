from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt

from app.core.config import settings

_ALGORITHM = "HS256"


def create_access_token(user_id: UUID) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(days=settings.AUTH_TOKEN_TTL_DAYS),
    }
    return jwt.encode(payload, settings.AUTH_SECRET, algorithm=_ALGORITHM)


def decode_access_token(token: str) -> UUID | None:
    try:
        payload = jwt.decode(token, settings.AUTH_SECRET, algorithms=[_ALGORITHM])
        return UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None
