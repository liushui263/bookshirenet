import { AddToShelfButton } from "@/components/AddToShelfButton";
import Link from "next/link";
import { getBook, getBookReviews } from "@/lib/api";
import type { Book, Review } from "@/lib/api";
import { getLocale } from "@/lib/i18n-server";
import { translator, type Locale, type Translate } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/session";

type BookDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(locale: Locale, tr: Translate, value?: string | null) {
  if (!value) return tr("Unknown", "未知");

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { id } = await params;
  const locale = await getLocale();
  const tr = translator(locale);
  const unknown = tr("Unknown", "未知");

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
      error instanceof Error ? error.message : tr("Failed to load book detail", "图书详情加载失败");
  }

  if (errorMessage || !book) {
    return (
      <main className="min-h-screen">
        <section className="mx-auto max-w-4xl px-6 py-10">
          <Link
            href="/"
            className="text-sm font-semibold text-gray-600 hover:text-gray-950"
          >
            {tr("← Back to Home", "← 返回首页")}
          </Link>

          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-8">
            <h1 className="text-2xl font-bold text-red-900">
              {tr("Failed to load book detail", "图书详情加载失败")}
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
  const signedIn = Boolean(await getCurrentUser());

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold text-gray-600 hover:text-gray-950"
          >
            {tr("← Back to Home", "← 返回首页")}
          </Link>

          <Link
            href="/search"
            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
          >
            {tr("Search Books", "搜索图书")}
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
                <span>{tr("Cover", "封面")}</span>
              )}
            </div>

            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
                {tr("Book Detail", "图书详情")}
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-950">
                {book.title}
              </h1>

              {book.subtitle && (
                <p className="mt-3 text-xl text-gray-600">{book.subtitle}</p>
              )}

              <div className="mt-5 flex flex-wrap gap-3 text-sm text-gray-600">
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  ⭐ {book.rating_avg ?? tr("N/A", "暂无")}
                </span>

                {book.rating_count != null && (
                  <span className="rounded-full bg-gray-100 px-3 py-1">
                    {tr(`${book.rating_count} ratings`, `${book.rating_count} 人评分`)}
                  </span>
                )}

                {book.original_language && (
                  <span className="rounded-full bg-gray-100 px-3 py-1">
                    {tr("Language:", "语言：")} {book.original_language}
                  </span>
                )}

                {book.page_count != null && (
                  <span className="rounded-full bg-gray-100 px-3 py-1">
                    {tr(`${book.page_count} pages`, `${book.page_count} 页`)}
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
                  <dt className="font-semibold text-gray-900">{tr("Publisher", "出版社")}</dt>
                  <dd className="mt-1 text-gray-600">
                    {book.publisher || unknown}
                  </dd>
                </div>

                <div>
                  <dt className="font-semibold text-gray-900">{tr("Published", "出版日期")}</dt>
                  <dd className="mt-1 text-gray-600">
                    {book.published_date || unknown}
                  </dd>
                </div>

                <div>
                  <dt className="font-semibold text-gray-900">ISBN-10</dt>
                  <dd className="mt-1 text-gray-600">
                    {book.isbn_10 || unknown}
                  </dd>
                </div>

                <div>
                  <dt className="font-semibold text-gray-900">ISBN-13</dt>
                  <dd className="mt-1 text-gray-600">
                    {book.isbn_13 || unknown}
                  </dd>
                </div>
              </dl>

              <div className="mt-8 flex flex-wrap gap-3">
                <AddToShelfButton bookId={book.id} signedIn={signedIn} />

                <Link
                  href="/shelf"
                  className="rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100"
                >
                  {tr("View My Shelf", "查看我的书架")}
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-950">{tr("Description", "简介")}</h2>

            {description ? (
              <p className="mt-4 whitespace-pre-line leading-8 text-gray-700">
                {description}
              </p>
            ) : (
              <p className="mt-4 text-gray-500">{tr("No description yet.", "暂无简介。")}</p>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-950">{tr("Reviews", "书评")}</h2>
              <p className="mt-2 text-gray-600">
                {tr("What readers think of this book.", "读者对这本书的评价。")}
              </p>
            </div>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
              {tr(`${reviews.length} total`, `共 ${reviews.length} 条`)}
            </span>
          </div>

          {reviews.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-gray-300 p-8 text-center">
              <h3 className="font-semibold text-gray-900">{tr("No reviews yet.", "还没有书评。")}</h3>
              <p className="mt-2 text-sm text-gray-600">
                {tr("Reviews will appear here after readers write them.", "读者写下书评后会显示在这里。")}
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
                        {tr("User:", "用户：")} {review.user_id}
                      </p>
                    </div>

                    <p className="text-sm text-gray-500">
                      {formatDate(locale, tr, review.updated_at)}
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
