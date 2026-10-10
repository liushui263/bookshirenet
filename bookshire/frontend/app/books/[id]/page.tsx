import { AddToShelfButton } from "@/components/AddToShelfButton";
import Link from "next/link";
import { getBook, getBookReviews } from "@/lib/api";
import type { Book, Review } from "@/lib/api";

type BookDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(value?: string | null) {
  if (!value) return "Unknown";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { id } = await params;

  let book: Book | null = null;
  let reviews: Review[] = [];
  let errorMessage: string | null = null;

  try {
    const [bookData, reviewData] = await Promise.all([
      getBook(id),
      getBookReviews(id),
    ]);

    book = bookData;
    reviews = reviewData;
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Failed to load book detail";
  }

  if (errorMessage || !book) {
    return (
      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-4xl px-6 py-10">
          <Link
            href="/"
            className="text-sm font-semibold text-gray-600 hover:text-gray-950"
          >
            ← Back to Home
          </Link>

          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-8">
            <h1 className="text-2xl font-bold text-red-900">
              Failed to load book detail
            </h1>
            <p className="mt-3 font-mono text-sm text-red-700">
              {errorMessage}
            </p>
          </div>
        </section>
      </main>
    );
  }

  const tags = book.tags || book.categories || [];
  const coverUrl = book.cover_url || book.canonical_cover_url;
  const description = book.description || book.canonical_description;
  const DEMO_USER_ID =
  process.env.NEXT_PUBLIC_DEMO_USER_ID ||"86f7818b-788e-4d0b-9e81-9c8bc918ac44";

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

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <div className="grid gap-8 md:grid-cols-[220px_1fr]">
            <div className="flex h-80 w-full items-center justify-center rounded-2xl bg-gray-100 text-gray-400 md:h-72">
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrl}
                  alt={book.title}
                  className="h-full w-full rounded-2xl object-cover"
                />
              ) : (
                <span>Cover</span>
              )}
            </div>

            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
                Book Detail
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-950">
                {book.title}
              </h1>

              {book.subtitle && (
                <p className="mt-3 text-xl text-gray-600">{book.subtitle}</p>
              )}

              <div className="mt-5 flex flex-wrap gap-3 text-sm text-gray-600">
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  ⭐ {book.rating_avg ?? "N/A"}
                </span>

                {book.rating_count != null && (
                  <span className="rounded-full bg-gray-100 px-3 py-1">
                    {book.rating_count} ratings
                  </span>
                )}

                {book.original_language && (
                  <span className="rounded-full bg-gray-100 px-3 py-1">
                    Language: {book.original_language}
                  </span>
                )}

                {book.page_count != null && (
                  <span className="rounded-full bg-gray-100 px-3 py-1">
                    {book.page_count} pages
                  </span>
                )}
              </div>

              {tags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-950 px-3 py-1 text-xs font-medium text-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <dl className="mt-6 grid gap-4 text-sm md:grid-cols-2">
                <div>
                  <dt className="font-semibold text-gray-900">Publisher</dt>
                  <dd className="mt-1 text-gray-600">
                    {book.publisher || "Unknown"}
                  </dd>
                </div>

                <div>
                  <dt className="font-semibold text-gray-900">Published</dt>
                  <dd className="mt-1 text-gray-600">
                    {book.published_date || "Unknown"}
                  </dd>
                </div>

                <div>
                  <dt className="font-semibold text-gray-900">ISBN-10</dt>
                  <dd className="mt-1 text-gray-600">
                    {book.isbn_10 || "Unknown"}
                  </dd>
                </div>

                <div>
                  <dt className="font-semibold text-gray-900">ISBN-13</dt>
                  <dd className="mt-1 text-gray-600">
                    {book.isbn_13 || "Unknown"}
                  </dd>
                </div>
              </dl>

              <div className="mt-8 flex flex-wrap gap-3">
                <AddToShelfButton userId={DEMO_USER_ID} bookId={book.id} />

                <Link
                  href="/shelf"
                  className="rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100"
                >
                  View My Shelf
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-950">Description</h2>

            {description ? (
              <p className="mt-4 whitespace-pre-line leading-8 text-gray-700">
                {description}
              </p>
            ) : (
              <p className="mt-4 text-gray-500">No description yet.</p>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-950">Reviews</h2>
              <p className="mt-2 text-gray-600">
                Reader reviews from the current backend.
              </p>
            </div>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
              {reviews.length} total
            </span>
          </div>

          {reviews.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-gray-300 p-8 text-center">
              <h3 className="font-semibold text-gray-900">No reviews yet.</h3>
              <p className="mt-2 text-sm text-gray-600">
                Reviews will appear here after users write them.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-2xl border border-gray-200 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-950">
                        ⭐ {review.rating}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        User: {review.user_id}
                      </p>
                    </div>

                    <p className="text-sm text-gray-500">
                      {formatDate(review.updated_at)}
                    </p>
                  </div>

                  {review.content && (
                    <p className="mt-4 leading-7 text-gray-700">
                      {review.content}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
