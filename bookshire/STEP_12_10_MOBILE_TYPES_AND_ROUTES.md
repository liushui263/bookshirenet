# Step 12.10 — Mobile TypeScript cleanup and route safety

This patch keeps the existing mobile behavior but tightens the implementation around three areas:

1. Centralized route helpers in `mobile/lib/routes.ts`.
2. Safer API error handling through `ApiError` and `getErrorMessage()`.
3. Safer book-detail route construction using `{ pathname: "/books/[id]", params: { id } }` instead of interpolated strings.

## Changed files

- `mobile/lib/api.ts`
- `mobile/lib/routes.ts`
- `mobile/components/UiPrimitives.tsx`
- `mobile/components/BookListCard.tsx`
- `mobile/app/index.tsx`
- `mobile/app/search.tsx`
- `mobile/app/shelf.tsx`
- `mobile/app/books/[id].tsx`

## Behavior preserved

- Home loading/search/shelf navigation
- Search by title/category/tag/description
- Shelf status grouping and updates
- Remove from Shelf
- Book Detail Add to Shelf
- Review create/update/delete
- Existing unread/read compatibility through `shelfStatus.ts`

## Verification

```bash
cd ~/project/05-Projects/BookShire/mobile
npx tsc --noEmit
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.4.39 npx expo start -c --host lan
```
