"use client";

import type { Book } from "@/lib/api";
import { SpineShelf, type SpineItem } from "@/components/spines/SpineShelf";

function toSpineItem(book: Book): SpineItem {
  const year = book.publication_year ?? book.published_date ?? null;
  return {
    id: book.id,
    title: book.title,
    authors: book.authors ?? [],
    cover: book.cover_url || book.canonical_cover_url || null,
    publisher: book.publisher,
    published: year == null ? null : String(year),
    isbn: book.isbn_13 || book.isbn_10,
    pages: book.page_count,
    language: book.original_language,
    description: book.canonical_description || book.description,
    link: { href: `/books/${book.id}`, label: "Details, reviews and add to shelf →" },
  };
}

// Catalog and search results as a bookcase of spines.
export function CatalogShelf({ books, label }: { books: Book[]; label: string }) {
  return <SpineShelf items={books.map(toSpineItem)} label={label} perRow={18} />;
}
