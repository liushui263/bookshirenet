import Link from "next/link";
import type { Book } from "@/lib/api";

type BookCardProps = {
  book: Book;
};

export function BookCard({ book }: BookCardProps) {
  const labels = Array.from(new Set([...(book.categories || []), ...(book.tags || [])]));
  const coverUrl = book.cover_url || book.canonical_cover_url;

  return (
    <Link
      href={`/books/${book.id}`}
      className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex gap-4">
        <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt={book.title}
              className="h-full w-full rounded-xl object-cover"
            />
          ) : (
            <span>Cover</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-lg font-semibold text-gray-900">
            {book.title}
          </h3>

          {book.subtitle && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">
              {book.subtitle}
            </p>
          )}

          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <span>⭐ {book.rating_avg ?? "N/A"}</span>
            {book.rating_count != null && (
              <span className="text-gray-400">
                ({book.rating_count} ratings)
              </span>
            )}
          </div>

          {labels.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {labels.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
