import Link from "next/link";
import { SearchClient } from "@/components/SearchClient";
import { getT } from "@/lib/i18n-server";

export default async function SearchPage() {
  const tr = await getT();
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
            href="/shelf"
            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
          >
            {tr("My Shelf", "我的书架")}
          </Link>
        </div>

        <header className="mb-8 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            {tr("Search", "搜索")}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-950">
            {tr("Find your next book.", "找到你的下一本书。")}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-600">
            {tr("Search every book in the BookShire library by title, author or tag.", "按书名、作者或标签搜索布客舍书坊的藏书。")}
          </p>
        </header>

        <SearchClient />
      </section>
    </main>
  );
}
