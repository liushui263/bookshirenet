# BookShire

BookShire is a Next.js (Pages Router) app that builds 12 daily book shelves of 10 books each, in three tabs:

- 中文: new releases, plus popular this week / month / year
- English: new releases, plus popular this week / month / year
- French, Spanish, German, Russian: popular this year

"Popular" lists come from Google Books search results (with Open Library as a fallback), not from sales charts. Within a language, a book appears on only one of the week / month / year shelves.

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

- `GOOGLE_BOOKS_API_KEY`: server-only key used by `lib/fetchBooks.ts`. Each full refresh makes about 10 Google Books requests.
- `CRON_SECRET`: bearer token checked by `pages/api/revalidate.ts`.

Do not use `NEXT_PUBLIC_` for the Google Books key.

## Data Flow

1. `pages/index.tsx` runs `getStaticProps`.
2. `getStaticProps` calls `fetchBooks()` in `lib/fetchBooks.ts`.
3. `fetchBooks()` requests Google Books with timeout/retry/fallback logic.
4. Result is serialized and returned as page props. The browser does not call any book API, so page views cost no quota.
5. If a background regeneration returns no books at all, `getStaticProps` throws so Next.js keeps serving the previous page.

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
  - Cached at the CDN for an hour (`s-maxage=3600, stale-while-revalidate=86400`) to protect the API quota.

- `GET /api/revalidate`
  - Requires `Authorization: Bearer <CRON_SECRET>`.
  - Triggers revalidation for `/`.

## Operational Notes

- Temporary DNS/API failures are handled with bounded retries and timeout.
- If Google Books is unavailable or quota-limited, popular lists fall back to Open Library; new-release lists may be empty. Builds never crash on source failures.
- Books without a cover use the local `public/cover-placeholder.svg`.
- If the API key is missing, the app logs once and serves empty shelves.
