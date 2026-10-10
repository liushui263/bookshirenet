# BookShire Review Fixes V2

## Fixed

- Backend book search now matches `categories` and `tags`, not only title/subtitle/normalized title.
- Backend book search also checks `canonical_description` for keyword search.
- Frontend `BookCard` now displays both categories and tags instead of choosing only tags when tags exist.
- Mobile Search placeholder now says `Title, category, tag, keyword`.
- Mobile Search result cards now display both categories and tags.

## Files changed

- `backend/app/repositories/book_repo.py`
- `frontend/components/BookCard.tsx`
- `mobile/app/search.tsx`

## Verify

Run backend, then test searches by category/tag:

```bash
curl "http://localhost:8000/api/v1/books/search?q=history"
curl "http://localhost:8000/api/v1/books/search?q=science"
curl "http://localhost:8000/api/v1/books/search?q=fiction"
```

Restart Expo/Next.js after changing frontend/mobile code.
