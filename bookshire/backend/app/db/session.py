import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import settings

# Serverless hosts (Vercel) start many short-lived instances. Let the database's
# connection pooler (e.g. Supabase's transaction pooler) do the pooling instead.
_serverless = bool(os.getenv("VERCEL")) or os.getenv("DB_NULL_POOL", "false").lower() == "true"

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    **({"poolclass": NullPool} if _serverless else {}),
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
