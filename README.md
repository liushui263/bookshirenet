# BookShire

BookShire is a Next.js (Pages Router) app that curates three daily book shelves:

- English bestsellers
- Latest English fiction
- Latest Chinese books

The homepage is statically generated and refreshed with ISR. A protected revalidation endpoint is available for scheduled refreshes.

## Tech Stack

- Next.js `16`
- React `19`
- TypeScript
- Vercel Cron + ISR
- Google Books API

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```env
GOOGLE_BOOKS_API_KEY=your_google_books_api_key
CRON_SECRET=your_long_random_secret
```

3. Run development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
npm run start
```

## Environment Variables

- `GOOGLE_BOOKS_API_KEY`: server-only key used by `lib/fetchBooks.ts`.
- `CRON_SECRET`: bearer token checked by `pages/api/revalidate.ts`.

Do not use `NEXT_PUBLIC_` for the Google Books key.

## Data Flow

1. `pages/index.tsx` runs `getStaticProps`.
2. `getStaticProps` calls `fetchBooks()` in `lib/fetchBooks.ts`.
3. `fetchBooks()` requests Google Books with timeout/retry/fallback logic.
4. Result is serialized and returned as page props.
5. Client-side effect requests `/api/books` for a live refresh after load.

## Refresh Strategy

- ISR: homepage revalidates every 24 hours.
- On-demand: `pages/api/revalidate.ts` revalidates `/` when called with:

```http
Authorization: Bearer <CRON_SECRET>
```

- Vercel schedule is configured in `vercel.json`:

```json
{
  "crons": [{ "path": "/api/revalidate", "schedule": "0 12 * * *" }]
}
```

## API Endpoints

- `GET /api/books`
  - Returns `BooksData` from live Google Books fetches.
  - Responds with `Cache-Control: no-store, max-age=0`.

- `GET /api/revalidate`
  - Requires `Authorization: Bearer <CRON_SECRET>`.
  - Triggers revalidation for `/`.

## Operational Notes

- Temporary DNS/API failures are handled with bounded retries and timeout.
- If Google Books is unavailable or quota-limited, empty lists are returned instead of crashing builds.
- If the API key is missing, the app logs once and serves empty shelves.
