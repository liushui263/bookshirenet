import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Section from "../components/Section";
import { fetchBooks, type BooksData } from "../lib/fetchBooks";

export default function Home({
  data,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <div className="container">
      <h1>📚 BookShire</h1>
      <p>Auto-updated new releases in English and Chinese.</p>
      <p>Last refreshed: {new Date(data.updatedAt).toLocaleString()}</p>

      <Section title="🔥 Top Selling (EN)" books={data.enTrending} />
      <Section title="🆕 Latest (EN)" books={data.enLatest} />
      <Section title="📖 中文新书" books={data.cnLatest} />
    </div>
  );
}

export const getStaticProps: GetStaticProps<{ data: BooksData }> = async () => {
  const data = await fetchBooks();

  return {
    props: { data },
    revalidate: 86400, // 每天更新一次，cron 也会主动触发刷新
  };
};
