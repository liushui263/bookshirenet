# BookShire Review Fixes

## Main issues found

1. **Mobile shelf status mismatch**
   - Backend uses `unread`, `reading`, `read`, `abandoned`.
   - Mobile shelf grouped by `want_to_read`, `reading`, `finished`, `abandoned`.
   - Result: newly added books were saved as `unread` but did not appear under any visible mobile shelf group.

2. **Mobile API base URL was fragile**
   - Expo on a real phone cannot use `localhost` to reach the backend running on the development computer.
   - Added a safer API base URL resolver and documented Android emulator / real phone settings in `mobile/.env`.

3. **Mobile routes still contained Expo starter tab screens**
   - The `(tabs)` home screen was still the Expo starter template.
   - Root Stack now exposes the real BookShire pages: home, search, shelf, and book detail.
   - Added a real mobile search page.

4. **Shelf update could drop book metadata**
   - Updating a shelf item returned a smaller backend payload and the mobile client replaced the whole item.
   - Mobile now merges the update into the existing shelf item instead of losing `book_title`, `book_id`, tags, etc.

5. **Add-to-shelf UX was unclear on web**
   - The web button only displayed a message.
   - It now refreshes the route and shows a direct `Open My Shelf` link.

6. **docker-compose-dev.yml was stale**
   - It used old database credentials and omitted the frontend/adminer setup.
   - It has been synchronized with the working `docker-compose.yml`.

7. **Book rating fields were inconsistent**
   - Backend model uses `avg_rating`, while frontend expected `rating_avg`.
   - Added `rating_avg` compatibility property and included rating fields in the book response schema.

## Files changed

- `backend/app/api/v1/user_books.py`
- `backend/app/models/book.py`
- `backend/app/repositories/user_book_repo.py`
- `backend/app/schemas/book.py`
- `backend/app/services/user_book_service.py`
- `docker-compose-dev.yml`
- `frontend/components/AddToShelfButton.tsx`
- `mobile/.env`
- `mobile/app/_layout.tsx`
- `mobile/app/(tabs)/index.tsx`
- `mobile/app/(tabs)/explore.tsx`
- `mobile/app/search.tsx`
- `mobile/app/shelf.tsx`
- `mobile/lib/api.ts`

## Verify after replacing files

```bash
cd ~/project/05-Projects/BookShire

docker compose down -v
docker compose up --build

curl http://localhost:8000/health
curl http://localhost:8000/api/v1/books/

# Add Sapiens to demo user's shelf
curl -X POST \
  http://localhost:8000/api/v1/users/86f7818b-788e-4d0b-9e81-9c8bc918ac44/books/by-book/b016b716-3e4b-41ba-8ab3-be6bf214a308

# Confirm shelf now contains it
curl http://localhost:8000/api/v1/users/86f7818b-788e-4d0b-9e81-9c8bc918ac44/books
```

For Expo on a real phone, edit `mobile/.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:8000
EXPO_PUBLIC_DEMO_USER_ID=86f7818b-788e-4d0b-9e81-9c8bc918ac44
```

Then restart Expo with cache cleared:

```bash
cd mobile
npx expo start -c
```


## v3 hydration fix

Fixed a Next.js hydration mismatch on `/shelf` caused by formatting `updated_at` with `date.toLocaleString()` without an explicit timezone. The server and browser can run in different time zones, so the server rendered one timestamp while the client rendered another. `frontend/components/ShelfClient.tsx` now formats dates with `Intl.DateTimeFormat` and `timeZone: "America/Chicago"` for deterministic SSR/client output.
