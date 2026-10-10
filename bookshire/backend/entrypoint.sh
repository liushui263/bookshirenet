#!/bin/sh
set -e

echo "Waiting for database..."
python wait_for_db.py

echo "Running migrations..."
# alembic upgrade head

if [ "${SEED_DATA:-true}" = "true" ]; then
  echo "Seeding development books..."
  python -m app.db.seed_books
fi

echo "Starting server..."
if [ "${ENV:-dev}" = "prod" ]; then
  exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
fi

exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
