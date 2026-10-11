import Link from "next/link";
import { CatalogShelf } from "@/components/spines/CatalogShelf";
import { getBooks, type Book } from "@/lib/api";

export default async function CatalogPage() {
  let books: Book[] = [];
  let errorMessage: string | null = null;

  try {
    books = await getBooks();
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Failed to load books";
  }

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <header className="flex flex-col gap-6 border-b border-gray-200 pb-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Catalog
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-950 md:text-5xl">
              Books in the BookShire library.
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-600">
              Every book readers have added to BookShire. Open one to see its
              details and reviews, or add it to your shelf.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/search"
              className="rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
            >
              Search Books
            </Link>
            <Link
              href="/shelf"
              className="rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
            >
              My Shelf
            </Link>
          </div>
        </header>

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-950">
                Books
              </h2>
              <p className="mt-2 text-gray-600">
                Books from your current FastAPI backend.
              </p>
            </div>

            <Link
              href="/books"
              className="text-sm font-semibold text-gray-700 hover:text-gray-950"
            >
              View all →
            </Link>
          </div>

          {errorMessage && (
            <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
              Book API failed.
              <br />
              <span className="font-mono">{errorMessage}</span>
            </div>
          )}

          {books.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                No books found yet.
              </h3>
              <p className="mt-2 text-gray-600">
                Check that the backend is running at http://localhost:8000 and
                that seed data exists.
              </p>
            </div>
          ) : (
            <div className="mt-8">
              <CatalogShelf books={books} label="Catalog" />
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
