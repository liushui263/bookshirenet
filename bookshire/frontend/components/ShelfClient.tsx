"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReadingStatus, UserBook } from "@/lib/api";
import { listMyBooksFromBrowser, removeMyBook, updateMyBookStatus } from "@/lib/api";
import { BookDetailsEditor, conditionLabels } from "@/components/BookDetailsEditor";
import { useT } from "@/components/LocaleProvider";
import type { Translate } from "@/lib/i18n";
import { ShelfTools } from "@/components/ShelfTools";
import { SpineShelf, type SpineItem } from "@/components/spines/SpineShelf";

type ShelfStatus =
  | "unread"
  | "want_to_read"
  | "reading"
  | "read"
  | "finished"
  | "abandoned";

function statusLabels(tr: Translate): Record<ShelfStatus, string> {
  return {
    unread: tr("Want to Read", "想读"),
    want_to_read: tr("Want to Read", "想读"),
    reading: tr("Reading", "在读"),
    read: tr("Finished", "读过"),
    finished: tr("Finished", "读过"),
    abandoned: tr("Abandoned", "弃读"),
  };
}

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

function toSpineItem(item: UserBook, tr: Translate): SpineItem {
  const conditions = conditionLabels(tr);
  const extraFacts: [string, string][] = [
    [tr("Condition", "品相"), (item.condition && conditions[item.condition]) || tr("Not set", "未设置")],
    [
      tr("Who can see it", "谁能看到"),
      `${item.visibility === "public" ? tr("Everyone", "所有人") : tr("Only me", "仅自己")}${
        item.exchangeable ? tr(" · open to swap", " · 可交换") : ""
      }`,
    ],
  ];
  if (item.location_text) extraFacts.push([tr("Where", "位置"), item.location_text]);
  if (item.started_at) extraFacts.push([tr("Started", "开始阅读"), item.started_at]);
  if (item.finished_at) extraFacts.push([tr("Finished", "读完"), item.finished_at]);
  return {
    id: item.id,
    title: item.book_title,
    authors: item.book_authors ?? [],
    cover: item.book_cover_url || item.edition_cover_url || null,
    publisher: item.edition_publisher,
    published: item.edition_publication_year ? String(item.edition_publication_year) : null,
    isbn: item.edition_isbn_13 || item.edition_isbn_10,
    pages: item.edition_page_count,
    description: item.personal_notes_summary
      ? tr(`My notes: ${item.personal_notes_summary}`, `我的笔记：${item.personal_notes_summary}`)
      : item.book_description,
    extraFacts,
    link: { href: `/books/${item.book_id}`, label: tr("Book page and reviews →", "图书页与书评 →") },
  };
}

type ShelfClientProps = {
  initialItems: UserBook[];
};

export function ShelfClient({ initialItems }: ShelfClientProps) {
  const tr = useT();
  const STATUS_LABELS = statusLabels(tr);
  const [items, setItems] = useState<UserBook[]>(initialItems);
  const [message, setMessage] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  function upsertItem(item: UserBook) {
    setItems((current) =>
      current.some((entry) => entry.id === item.id)
        ? current.map((entry) => (entry.id === item.id ? item : entry))
        : [item, ...current]
    );
  }

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
      const updated = await updateMyBookStatus(userBookId, apiStatus);

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

      setMessage(
        tr(
          `Updated "${item.book_title}" to ${STATUS_LABELS[status]}.`,
          `已将《${item.book_title}》标记为${STATUS_LABELS[status]}。`,
        ),
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : tr("Failed to update reading status.", "阅读状态更新失败。")
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
      await removeMyBook(userBookId);

      setItems((current) =>
        current.filter((entry) => entry.id !== userBookId)
      );

      setMessage(tr(`Removed "${item.book_title}" from your shelf.`, `已从书架移除《${item.book_title}》。`));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : tr("Failed to remove shelf item.", "移除失败。")
      );
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div>
      <ShelfTools
        onAdded={upsertItem}
        onImported={async () => setItems(await listMyBooksFromBrowser())}
      />

      {message && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-sm">
          {message}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <h2 className="text-xl font-bold text-gray-950">
            {tr("Your shelf is empty.", "你的书架还是空的。")}
          </h2>
          <p className="mt-2 text-gray-600">
            {tr(
              "Add a book by ISBN above, import a file, or pick books from the home page.",
              "可以在上方按 ISBN 添加、导入文件，或从首页挑选图书。",
            )}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            {tr("Browse Books", "浏览图书")}
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
                  {tr("No books in this section.", "这一栏还没有书。")}
                </div>
              ) : (
                <SpineShelf
                  items={grouped[status].map((entry) => toSpineItem(entry, tr))}
                  label={STATUS_LABELS[status]}
                  perRow={14}
                  renderActions={(spine) => {
                    const item = items.find((entry) => entry.id === spine.id);
                    if (!item) return null;
                    const isBusy = busyKey?.startsWith(item.id);
                    return (
                      <div className="w-full">
                        {item.personal_tags.length > 0 && (
                          <div className="mb-3 flex flex-wrap gap-2">
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
                        <div className="flex flex-wrap gap-2">
                          <label className="sr-only" htmlFor={`status-${item.id}`}>
                            {tr("Reading status", "阅读状态")}
                          </label>
                          <select
                            id={`status-${item.id}`}
                            value={normalizeStatus(item.status)}
                            disabled={isBusy}
                            onChange={(event) =>
                              handleStatusChange(item, event.target.value as ShelfStatus)
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
                            type="button"
                            disabled={isBusy}
                            aria-expanded={editingId === item.id}
                            onClick={() =>
                              setEditingId((current) => (current === item.id ? null : item.id))
                            }
                            className="rounded-full border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 disabled:opacity-50"
                          >
                            {tr("Edit details", "编辑详情")}
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleRemove(item)}
                            className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                          >
                            {tr("Remove", "移除")}
                          </button>
                        </div>
                        {editingId === item.id && (
                          <BookDetailsEditor
                            item={item}
                            onCancel={() => setEditingId(null)}
                            onSaved={(updated) => {
                              upsertItem(updated);
                              setEditingId(null);
                              setMessage(tr(`Saved "${updated.book_title}".`, `已保存《${updated.book_title}》。`));
                            }}
                          />
                        )}
                      </div>
                    );
                  }}
                />
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
