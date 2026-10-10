import os


def _normalize_database_url(url: str) -> str:
    # SQLAlchemy 2.1 maps a bare postgresql:// URL to psycopg 3, but this app ships psycopg2.
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg2://" + url[len("postgresql://"):]
    return url


_DEV_AUTH_SECRET = "bookshire-dev-only-secret-change-me"


def _csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


class Settings:
    ENV: str = os.getenv("ENV", "dev")

    DATABASE_URL: str = _normalize_database_url(
        os.getenv(
            "DATABASE_URL",
            "postgresql+psycopg2://book:book@localhost:5432/bookdb",
        )
    )

    # Signs login tokens. Must be set to a long random value outside local development.
    AUTH_SECRET: str = os.getenv("AUTH_SECRET", "")
    AUTH_TOKEN_TTL_DAYS: int = int(os.getenv("AUTH_TOKEN_TTL_DAYS", "30"))

    # Extra browser origins allowed by CORS, e.g. "https://bookshire.net,https://www.bookshire.net".
    CORS_ORIGINS: list[str] = _csv(os.getenv("CORS_ORIGINS", ""))

    # Old /users/{user_id}/books routes that trust the user id in the URL.
    # Only for local development of clients that have no sign-in yet (the mobile app).
    ENABLE_LEGACY_USER_ROUTES: bool = os.getenv("ENABLE_LEGACY_USER_ROUTES", "false").lower() == "true"

    def __init__(self):
        if not self.AUTH_SECRET:
            if self.ENV == "prod":
                raise RuntimeError("AUTH_SECRET must be set when ENV=prod")
            self.AUTH_SECRET = _DEV_AUTH_SECRET


settings = Settings()
