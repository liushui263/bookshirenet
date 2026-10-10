"use client";

import { useState } from "react";
import { BookCard } from "@/components/BookCard";
import { searchBooks } from "@/lib/api";
import type { Book } from "@/lib/api";

export function SearchClient() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setBooks([]);
      setHasSearched(false);
      setErrorMessage(null);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setErrorMessage(null);

    try {
      const results = await searchBooks(trimmedQuery);
      setBooks(results);
    } catch (error) {
      setBooks([]);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to search books."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <form
        onSubmit={handleSearch}
        className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <label
          htmlFor="book-search"
          className="block text-sm font-semibold text-gray-900"
        >
          Search by title, tag, category, or keyword
        </label>

        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <input
            id="book-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try Sapiens, history, science..."
            className="min-h-12 flex-1 rounded-full border border-gray-300 bg-white px-5 text-gray-950 outline-none transition focus:border-gray-950"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="rounded-full bg-gray-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-50"
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {errorMessage && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          <p className="font-semibold">Search failed</p>
          <p className="mt-2 font-mono">{errorMessage}</p>
        </div>
      )}

      {hasSearched && !isLoading && !errorMessage && (
        <section className="mt-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-950">
              Search Results
            </h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
              {books.length} found
            </span>
          </div>

          {books.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <h3 className="font-semibold text-gray-900">No books found.</h3>
              <p className="mt-2 text-sm text-gray-600">
                Try a broader keyword such as history, science, or Sapiens.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
