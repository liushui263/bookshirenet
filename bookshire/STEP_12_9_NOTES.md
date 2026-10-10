# Step 12.9 Mobile review/shelf shared UI components

This patch extracts repeated mobile UI into shared components while preserving the existing backend/API behavior.

## New shared components

- `mobile/components/UiPrimitives.tsx`
  - AppHeader
  - NavLinks
  - ActionButton
  - LoadingCard
  - ErrorCard
  - EmptyCard
  - SuccessCard
  - SectionHeader
  - TagChips
  - BodyText / MutedText
  - InlineLinkButton

- `mobile/components/BookListCard.tsx`
  - Shared Home/Search book card.

- `mobile/components/ShelfStatusButtons.tsx`
  - Shared shelf status button group using `mobile/lib/shelfStatus.ts`.

- `mobile/components/ReviewCard.tsx`
  - Shared review rendering and stable Chicago timezone date formatting.

## Updated screens

- `mobile/app/index.tsx`
- `mobile/app/search.tsx`
- `mobile/app/shelf.tsx`
- `mobile/app/books/[id].tsx`

## Notes

- No backend changes are required.
- No database reset is required.
- Review create/update/delete behavior is preserved.
- Shelf status normalization from Step 12.8 is preserved.
- This also fixes a duplicate `const title = "Delete review?";` line in `mobile/app/books/[id].tsx`.
