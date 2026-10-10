# BookShire

BookShire is a containerized book management platform. The current MVP includes:

- FastAPI backend
- PostgreSQL/PostGIS database
- SQLAlchemy models and repositories
- Alembic migration structure
- Next.js frontend
- User shelf flow
- Book detail page
- Search page
- Reviews API
- Seed data for local development
- Docker Compose full-stack dev environment

## Accounts and sign-in

People create an account with email and password (`/register`, `/login` on the website). The API issues a signed token and everything personal is scoped to the signed-in user:

```text
POST /api/v1/auth/register   {email, password, display_name} -> {access_token, user}
POST /api/v1/auth/login      {email, password}               -> {access_token, user}
GET  /api/v1/auth/me
GET|POST /api/v1/me/books, POST /api/v1/me/books/by-book/{book_id}
PATCH|DELETE /api/v1/me/books/{id}
GET  /api/v1/me/reviews; writing, editing and deleting reviews also need sign-in
```

Send the token as `Authorization: Bearer <token>`. The website keeps it in an httpOnly cookie and calls the API through its own `/api/backend/...` proxy, so page scripts never see it.

Local development signs in as the seeded demo user with `demo@bookshire.local` / `bookshire-demo` (set `DEMO_USER_PASSWORD` to change it; never seeded when `ENV=prod`).

Backend settings:

| Variable | Purpose |
|---|---|
| `AUTH_SECRET` | Signs login tokens. Required when `ENV=prod`; use a long random string. |
| `AUTH_TOKEN_TTL_DAYS` | How long a sign-in lasts (default 30). |
| `CORS_ORIGINS` | Extra allowed browser origins, comma-separated (e.g. `https://bookshire.net`). |
| `ENABLE_LEGACY_USER_ROUTES` | `true` mounts the old `/users/{user_id}/books` routes, which trust the id in the URL. Local dev only, for the mobile app until it gets sign-in. |

An existing database gets the new `users.password_hash` column by re-running `backend/db/init.sql` (it is idempotent): `docker compose exec -T db psql -U bookshire -d bookshire < backend/db/init.sql`.

API tests (with the stack running): `cd backend && pip install -r requirements-dev.txt && python -m pytest tests`.

## Deploying: Supabase database + Vercel API

1. **Database.** In a Supabase project, open the SQL Editor, paste all of `backend/db/init.sql` and run it. It is idempotent, so running it again later upgrades the schema. It enables the extensions it needs (PostGIS, citext, pg_trgm, unaccent, pgcrypto) and locks BookShire's tables away from Supabase's public REST API (row level security on, `anon`/`authenticated` access revoked). When adding a table to `init.sql`, add it to the lock-down list at the end too.
2. **Connection string.** Project Settings → Database → Connect → *Transaction pooler* URI (port 6543). Keep it out of chat and git; it goes straight into Vercel.
3. **API on Vercel.** New Vercel project from this repo with *Root Directory* `bookshire/backend` (`vercel.json` selects the FastAPI preset; `index.py` is the entry point). Environment variables:
   - `DATABASE_URL`: the pooler URI from step 2
   - `AUTH_SECRET`: a long random string, e.g. `python -c "import secrets; print(secrets.token_urlsafe(48))"`
   - `ENV`: `prod`
   - `CORS_ORIGINS`: `https://bookshire.net,https://www.bookshire.net`
4. Check `https://<api-project>.vercel.app/health` returns `{"status":"ok"}`.

On Vercel the API uses no connection pool of its own (`NullPool`) and relies on Supabase's pooler; set `DB_NULL_POOL=true` to do the same elsewhere.

## The website (bookshire.net)

`frontend/` is the whole bookshire.net site. Its home page is the daily discovery shelves (new and popular fiction in six languages, from Google Books with Open Library as a fallback), and every book there has a **+ My shelf** button that saves it into the BookShire catalog and the reader's shelf. The shelves are fetched at most once a day and cached for everyone, so visits don't spend Google Books quota; `/api/books` serves the same data as JSON.

Frontend settings (Vercel project for bookshire.net, Root Directory `bookshire/frontend`):

| Variable | Purpose |
|---|---|
| `INTERNAL_API_BASE_URL` | The API's URL, e.g. `https://bookshirenet-api.vercel.app` |
| `NEXT_PUBLIC_API_BASE_URL` | Same URL, for the few calls made straight from the browser (search) |
| `GOOGLE_BOOKS_API_KEY` | Server-only key for the discovery shelves |
| `CRON_SECRET` | Lets the daily Vercel cron (`vercel.json`) call `/api/revalidate` to refresh the shelves |

## Current MVP Features

```text
Home page
Book detail page
Search page
My Shelf page
Add book to shelf
Update reading status
Soft-delete shelf item
Book reviews API
CORS
/health endpoint
Seed demo user
Seed 10 demo books and editions
Persistent local database volume
Tech Stack
Backend:   FastAPI + SQLAlchemy
Database:  PostgreSQL + PostGIS
Frontend:  Next.js + React + TypeScript + Tailwind
DevOps:    Docker Compose
Admin UI:  Adminer
Local Development Quick Start

From the project root:

docker compose up --build

Then open:

Frontend: http://localhost:3000
Backend:  http://localhost:8000
API docs: http://localhost:8000/docs
Adminer:  http://localhost:8080
Health:   http://localhost:8000/health

Default local database credentials:

System:   PostgreSQL
Server:   db
User:     bookshire
Password: password
Database: bookshire
Local Frontend Development Without Docker Frontend

If the Docker frontend is already running, stop it first:

docker compose stop frontend

Then run the frontend directly:

cd frontend
npm run dev

Open:

http://localhost:3000

If port 3000 is already occupied, Next.js may use 3001.

Important Docker Notes

The PostgreSQL data is stored in a Docker named volume:

postgres_data

This means your local data survives:

docker compose down
docker compose restart
docker compose up --build
computer restart

Do not run this unless you intentionally want to delete local database data:

docker compose down -v

Also be careful with:

docker volume prune

It can remove unused Docker volumes.

Seed Data

During backend startup, the backend entrypoint runs:

python -m app.db.seed_books

The seed process ensures local development has:

Demo user
10 demo books
10 demo editions

The seed script is idempotent. It uses fixed UUIDs and ON CONFLICT DO NOTHING, so it will not duplicate existing seed rows.

Demo user:

id:       86f7818b-788e-4d0b-9e81-9c8bc918ac44
email:    demo@bookshire.local
username: demo
name:     Demo User
Useful API Checks

Health:

curl -i http://localhost:8000/health

List books:

curl -s "http://localhost:8000/api/v1/books/" | python -m json.tool

Book detail:

curl -s "http://localhost:8000/api/v1/books/b016b716-3e4b-41ba-8ab3-be6bf214a308" | python -m json.tool

Search:

curl -s "http://localhost:8000/api/v1/books/search?q=sapiens" | python -m json.tool

Demo user shelf:

curl -s "http://localhost:8000/api/v1/users/86f7818b-788e-4d0b-9e81-9c8bc918ac44/books" | python -m json.tool

Add a book to shelf by book id:

curl -i -X POST \
  "http://localhost:8000/api/v1/users/86f7818b-788e-4d0b-9e81-9c8bc918ac44/books/by-book/b016b716-3e4b-41ba-8ab3-be6bf214a308"

Update shelf status:

curl -i -X PATCH \
  "http://localhost:8000/api/v1/users/86f7818b-788e-4d0b-9e81-9c8bc918ac44/books/<user_book_id>" \
  -H "Content-Type: application/json" \
  -d '{"status": "reading"}'

Valid reading statuses:

unread
reading
read
abandoned
Database Backup

Create a local development database backup:

./scripts/backup_dev_db.sh

Backups are written to:

backups/bookshire_dev_YYYYMMDD_HHMMSS.sql

Restore a backup:

cat backups/bookshire_dev_YYYYMMDD_HHMMSS.sql | docker exec -i bookshire-db psql -U bookshire -d bookshire
Common Commands

Use the Makefile if available:

make dev
make up
make down
make restart
make logs
make logs-backend
make logs-frontend
make health
make books
make shelf
make psql
make backup
Project Structure
BookShire/
├── backend/
│   ├── alembic/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   └── services/
│   ├── Dockerfile
│   ├── Dockerfile.prod
│   ├── entrypoint.sh
│   ├── requirements.txt
│   └── wait_for_db.py
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── db/
│   └── init.sql
├── docs/
├── scripts/
│   └── backup_dev_db.sh
├── backups/
├── docker-compose.yml
├── docker-compose-dev.yml
├── docker-compose-prod.yml
└── README.md
Current Development Roadmap

Completed:

1. user_books table
2. user_books backend API
3. books detail/search API
4. reviews API
5. CORS and /health
6. Next.js frontend
7. Home page
8. Book detail page
9. My Shelf page
10. Search page
11. Docker Compose frontend integration
11.5 Add to My Shelf web flow
Seed demo user and 10 demo books
Persistent local development database

Next:

12. Start Expo App

Before Expo, useful optional cleanup:

Add backend tests
Add frontend error boundaries
Improve seed data covers
Add auth/register/login later
Add formal users API
Add book creation UI

