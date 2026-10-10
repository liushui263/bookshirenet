"use client";

import Link from "next/link";
import { useState } from "react";
import type { Book } from "@/lib/discovery/fetchBooks";

type Props = {
  book: Book;
  signedIn: boolean;
};

type State = "idle" | "saving" | "saved" | "error";

// fetchBooks prefixes Open Library ids with "ol-"; everything else is a Google Books volume id.
function sourceOf(book: Book) {
  return book.id.startsWith("ol-")
    ? { source: "open_library", external_id: book.id.slice(3) }
    : { source: "google_books", external_id: book.id };
}

export function AddDiscoveryBookButton({ book, signedIn }: Props) {
  const [state, setState] = useState<State>("idle");

  if (!signedIn) {
    return (
      <Link className="card-add" href="/login?next=/">
        Sign in to add
      </Link>
    );
  }

  if (state === "saved") {
    return (
      <Link className="card-add card-add-done" href="/shelf">
        On your shelf ✓
      </Link>
    );
  }

  async function handleAdd() {
    setState("saving");
    try {
      const res = await fetch("/api/backend/me/books/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sourceOf(book),
          title: book.title,
          authors: book.authors,
          cover_url: book.cover,
          language: book.language,
          published_date: book.publishedDate,
        }),
      });
      setState(res.ok ? "saved" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <button
      type="button"
      className="card-add"
      onClick={handleAdd}
      disabled={state === "saving"}
    >
      {state === "saving" ? "Adding..." : state === "error" ? "Try again" : "+ My shelf"}
    </button>
  );
}
