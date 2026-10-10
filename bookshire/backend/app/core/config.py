import os

class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://book:book@localhost:5432/bookdb"
    )

settings = Settings()
