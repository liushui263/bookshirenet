# BookShire

bookshire.net is a book management and exchange website: discover new and popular books, keep your own library, and (soon) swap books with people nearby.

Everything lives in [`bookshire/`](bookshire/README.md):

- `bookshire/frontend`: the Next.js website deployed to bookshire.net (Vercel project root directory). Its home page shows the daily discovery shelves; signed-in users get a shelf, reviews and search.
- `bookshire/backend`: the FastAPI + PostgreSQL API (Vercel project `bookshirenet-api`, database on Supabase).
- `bookshire/mobile`: the Expo mobile app.

See [`bookshire/README.md`](bookshire/README.md) for running it locally, environment variables and deployment.

This repo merged the original bookshirenet discovery site with [liushui263/bookShire](https://github.com/liushui263/bookShire), keeping both histories. The discovery site's code now lives in `bookshire/frontend` (`lib/discovery/`, `components/discovery/`).
