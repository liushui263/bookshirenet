# Step 12.8 Mobile State Normalization Cleanup

This patch centralizes mobile shelf status compatibility in one shared helper file.

## New file

- `mobile/lib/shelfStatus.ts`

It normalizes backend/current statuses:

- `unread` -> `want_to_read`
- `want_to_read` -> `want_to_read`
- `read` -> `finished`
- `finished` -> `finished`
- `reading` -> `reading`
- `abandoned` -> `abandoned`

The UI now uses canonical mobile statuses:

- `want_to_read`
- `reading`
- `finished`
- `abandoned`

When sending status back to the current backend, the helper converts:

- `want_to_read` -> `unread`
- `finished` -> `read`

## Updated files

- `mobile/app/shelf.tsx`
- `mobile/lib/api.ts`
- `mobile/lib/shelfStatus.ts`

## Why

Before this change, each screen could accidentally implement its own mapping between `unread/read` and `want_to_read/finished`. That caused books to exist in the database but disappear from the expected UI section.
