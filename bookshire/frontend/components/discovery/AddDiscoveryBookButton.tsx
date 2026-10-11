"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import type { Book } from "@/lib/discovery/fetchBooks";

type Props = {
  book: Book;
  signedIn: boolean;
};

const TEXT = {
  en: { signIn: "Sign in to add", saved: "On your shelf ✓", saving: "Adding...", retry: "Try again", add: "+ My shelf" },
  zh: { signIn: "登录后加入书架", saved: "已在我的书架 ✓", saving: "正在加入…", retry: "再试一次", add: "+ 加入我的书架" },
};

type State = "idle" | "saving" | "saved" | "error";

// fetchBooks prefixes Open Library ids with "ol-"; everything else is a Google Books volume id.
function sourceOf(book: Book) {
  return book.id.startsWith("ol-")
    ? { source: "open_library", external_id: book.id.slice(3) }
    : { source: "google_books", external_id: book.id };
}

export function AddDiscoveryBookButton({ book, signedIn }: Props) {
  const locale = useLocale();
  const [state, setState] = useState<State>("idle");
  const text = TEXT[locale];

  if (!signedIn) {
    return (
      <Link className="card-add" href="/login?next=/">
        {text.signIn}
      </Link>
    );
  }

  if (state === "saved") {
    return (
      <Link className="card-add card-add-done" href="/shelf">
        {text.saved}
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
      {state === "saving" ? text.saving : state === "error" ? text.retry : text.add}
    </button>
  );
}
