import Link from "next/link";
import { CatalogShelf } from "@/components/spines/CatalogShelf";
import { getBooks, type Book } from "@/lib/api";
import { getT } from "@/lib/i18n-server";

export default async function CatalogPage() {
  const tr = await getT();
  let books: Book[] = [];
  let errorMessage: string | null = null;

  try {
    books = await getBooks();
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : tr("Failed to load books", "书目加载失败");
  }

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <header className="flex flex-col gap-6 border-b border-gray-200 pb-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
              {tr("Catalog", "书目")}
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-950 md:text-5xl">
              {tr("Books in the BookShire library.", "布客舍书坊的藏书。")}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-600">
              {tr(
                "Every book readers have added to BookShire. Open one to see its details and reviews, or add it to your shelf.",
                "读者们添加到布客舍书坊的每一本书。点开可查看详情和书评，也可以加入你的书架。",
              )}
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/search"
              className="rounded-full bg-gray-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
            >
              {tr("Search Books", "搜索图书")}
            </Link>
            <Link
              href="/shelf"
              className="rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
            >
              {tr("My Shelf", "我的书架")}
            </Link>
          </div>
        </header>

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-950">
                {tr("Books", "图书")}
              </h2>
              <p className="mt-2 text-gray-600">
                {tr("Books readers have added.", "读者添加的图书。")}
              </p>
            </div>

            <Link
              href="/books"
              className="text-sm font-semibold text-gray-700 hover:text-gray-950"
            >
              {tr("View all →", "查看全部 →")}
            </Link>
          </div>

          {errorMessage && (
            <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
              {tr("Couldn’t load the books right now.", "暂时无法加载图书。")}
              <br />
              <span className="font-mono">{errorMessage}</span>
            </div>
          )}

          {books.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {tr("No books found yet.", "还没有图书。")}
              </h3>
              <p className="mt-2 text-gray-600">
                {tr(
                  "No books yet. Add one from the home page or your shelf.",
                  "还没有书。可以从首页或你的书架添加一本。",
                )}
              </p>
            </div>
          ) : (
            <div className="mt-8">
              <CatalogShelf books={books} label={tr("Catalog", "书目")} />
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
