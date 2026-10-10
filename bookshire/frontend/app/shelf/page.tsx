import Link from "next/link";
import { ShelfClient } from "@/components/ShelfClient";
import { getUserBooks } from "@/lib/api";
import type { UserBook } from "@/lib/api";

const DEMO_USER_ID =
  process.env.NEXT_PUBLIC_DEMO_USER_ID ||
  "86f7818b-788e-4d0b-9e81-9c8bc918ac44";

export default async function ShelfPage() {
  let items: UserBook[] = [];
  let errorMessage: string | null = null;

  try {
    items = await getUserBooks(DEMO_USER_ID);
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Failed to load shelf";
  }

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
            href="/search"
            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
          >
            Search Books
          </Link>
        </div>

        <header className="mb-8 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            My Shelf
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-950">
            Track your reading life.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-600">
            Manage your personal shelf by book title, reading status, tags, and notes.
          </p>
        </header>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-xl font-bold text-red-900">
              Failed to load shelf
            </h2>
            <p className="mt-3 font-mono text-sm text-red-700">
              {errorMessage}
            </p>
          </div>
        ) : (
          <ShelfClient initialItems={items} userId={DEMO_USER_ID} />
        )}
      </section>
    </main>
  );
}
