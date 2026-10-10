import Link from "next/link";
import { SearchClient } from "@/components/SearchClient";

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold text-gray-600 hover:text-gray-950"
          >
            ← Back to Home
          </Link>

          <Link
            href="/shelf"
            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
          >
            My Shelf
          </Link>
        </div>

        <header className="mb-8 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Search
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-950">
            Find your next book.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-600">
            Search the current BookShire catalog from your FastAPI backend.
          </p>
        </header>

        <SearchClient />
      </section>
    </main>
  );
}
