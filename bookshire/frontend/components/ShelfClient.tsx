"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReadingStatus, UserBook } from "@/lib/api";
import { removeUserBook, updateUserBookStatus } from "@/lib/api";

type ShelfStatus =
  | "unread"
  | "want_to_read"
  | "reading"
  | "read"
  | "finished"
  | "abandoned";

const STATUS_LABELS: Record<ShelfStatus, string> = {
  unread: "Want to Read",
  want_to_read: "Want to Read",
  reading: "Reading",
  read: "Finished",
  finished: "Finished",
  abandoned: "Abandoned",
};

const STATUS_ORDER: ShelfStatus[] = [
  "unread",
  "reading",
  "finished",
  "abandoned",
];

function normalizeStatus(status?: string | null): ShelfStatus {
  if (status === "want_to_read") return "unread";
  if (status === "read") return "finished";
  if (status === "finished") return "finished";
  if (status === "reading") return "reading";
  if (status === "abandoned") return "abandoned";
  return "unread";
}

function toApiStatus(status: ShelfStatus): ReadingStatus {
  if (status === "want_to_read") return "unread" as ReadingStatus;
  if (status === "finished") return "read" as ReadingStatus;
  return status as ReadingStatus;
}

type ShelfClientProps = {
  initialItems: UserBook[];
  userId: string;
};

function formatDate(value?: string | null) {
  if (!value) return "Unknown";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function ShelfClient({ initialItems, userId }: ShelfClientProps) {
  const [items, setItems] = useState<UserBook[]>(initialItems);
  const [message, setMessage] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const result: Record<ShelfStatus, UserBook[]> = {
      unread: [],
      want_to_read: [],
      reading: [],
      read: [],
      finished: [],
      abandoned: [],
    };

    for (const item of items) {
      const status = normalizeStatus(item.status);
      result[status].push(item);
    }

    return result;
  }, [items]);

  async function handleStatusChange(item: UserBook, status: ShelfStatus) {
    const userBookId = item.id;
    const key = `${userBookId}:status`;

    setBusyKey(key);
    setMessage(null);

    try {
      const apiStatus = toApiStatus(status);
      const updated = await updateUserBookStatus(userId, userBookId, apiStatus);

      setItems((current) =>
        current.map((entry) =>
          entry.id === userBookId
            ? {
                ...entry,
                ...updated,
                status: apiStatus,
              }
            : entry
        )
      );

      setMessage(`Updated "${item.book_title}" to ${STATUS_LABELS[status]}.`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to update reading status."
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function handleRemove(item: UserBook) {
    const userBookId = item.id;
    const key = `${userBookId}:remove`;

    setBusyKey(key);
    setMessage(null);

    try {
      await removeUserBook(userId, userBookId);

      setItems((current) =>
        current.filter((entry) => entry.id !== userBookId)
      );

      setMessage(`Removed "${item.book_title}" from your shelf.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to remove shelf item."
      );
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div>
      {message && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-sm">
          {message}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <h2 className="text-xl font-bold text-gray-950">
            Your shelf is empty.
          </h2>
          <p className="mt-2 text-gray-600">
            Add an edition to your shelf from a book detail page.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Browse Books
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {STATUS_ORDER.map((status) => (
            <section key={status}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-950">
                  {STATUS_LABELS[status]}
                </h2>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                  {grouped[status].length}
                </span>
              </div>

              {grouped[status].length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
                  No books in this section.
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  {grouped[status].map((item) => {
                    const isBusy = busyKey?.startsWith(item.id);
                    const tags = [
                      ...(item.book_tags || []),
                      ...(item.book_categories || []),
                    ];
                    const coverUrl =
                      item.book_cover_url || item.edition_cover_url || null;

                    return (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex gap-4">
                          <Link
                            href={`/books/${item.book_id}`}
                            className="flex h-28 w-20 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400"
                          >
                            {coverUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={coverUrl}
                                alt={item.book_title}
                                className="h-full w-full rounded-xl object-cover"
                              />
                            ) : (
                              <span>Cover</span>
                            )}
                          </Link>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <Link
                                  href={`/books/${item.book_id}`}
                                  className="line-clamp-2 text-lg font-semibold text-gray-950 hover:underline"
                                >
                                  {item.book_title}
                                </Link>

                                {item.book_subtitle && (
                                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                                    {item.book_subtitle}
                                  </p>
                                )}

                                {item.edition_language && (
                                  <p className="mt-2 text-xs text-gray-500">
                                    Edition language: {item.edition_language}
                                  </p>
                                )}
                              </div>

                              <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                                {STATUS_LABELS[normalizeStatus(item.status)]}
                              </span>
                            </div>

                            {tags.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {Array.from(new Set(tags)).slice(0, 5).map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                              <div>
                                <dt className="font-semibold text-gray-900">
                                  Condition
                                </dt>
                                <dd className="mt-1 text-gray-600">
                                  {item.condition ?? "Unknown"}
                                </dd>
                              </div>

                              <div>
                                <dt className="font-semibold text-gray-900">
                                  Visibility
                                </dt>
                                <dd className="mt-1 text-gray-600">
                                  {item.visibility}
                                </dd>
                              </div>

                              <div>
                                <dt className="font-semibold text-gray-900">
                                  Updated
                                </dt>
                                <dd className="mt-1 text-gray-600">
                                  {formatDate(item.updated_at)}
                                </dd>
                              </div>

                              <div>
                                <dt className="font-semibold text-gray-900">
                                  Notes
                                </dt>
                                <dd className="mt-1 line-clamp-2 text-gray-600">
                                  {item.personal_notes_summary || "No notes"}
                                </dd>
                              </div>
                            </dl>

                            {item.personal_tags.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {item.personal_tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-full bg-gray-950 px-2.5 py-1 text-xs text-white"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="mt-5 flex flex-wrap gap-2">
                              <select
                                value={normalizeStatus(item.status)}
                                disabled={isBusy}
                                onChange={(event) =>
                                  handleStatusChange(
                                    item,
                                    event.target.value as ShelfStatus
                                  )
                                }
                                className="rounded-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                              >
                                {STATUS_ORDER.map((option) => (
                                  <option key={option} value={option}>
                                    {STATUS_LABELS[option]}
                                  </option>
                                ))}
                              </select>

                              <button
                                disabled={isBusy}
                                onClick={() => handleRemove(item)}
                                className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
