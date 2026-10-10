import os
import time

import psycopg2
from sqlalchemy.engine import make_url


DEFAULT_DATABASE_URL = "postgresql+psycopg2://book:book@db:5432/bookdb"
MAX_ATTEMPTS = int(os.getenv("DB_WAIT_MAX_ATTEMPTS", "60"))
SLEEP_SECONDS = float(os.getenv("DB_WAIT_SLEEP_SECONDS", "1"))


def connect_args_from_url(database_url: str) -> dict:
    url = make_url(database_url)
    return {
        "host": url.host,
        "port": url.port,
        "user": url.username,
        "password": url.password,
        "dbname": url.database,
    }


def main() -> None:
    database_url = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)
    connect_args = connect_args_from_url(database_url)

    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            with psycopg2.connect(**connect_args):
                print("DB is ready")
                return
        except Exception as exc:
            print(f"Waiting for DB (attempt {attempt}/{MAX_ATTEMPTS})...", exc)
            time.sleep(SLEEP_SECONDS)

    raise RuntimeError(
        f"Database was not ready after {MAX_ATTEMPTS} attempts: {database_url}"
    )


if __name__ == "__main__":
    main()
