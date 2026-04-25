import Section from "../components/Section";
import { fetchBooks } from "../lib/fetchBooks";

export default function Home({ data }) {
  return (
    <div className="container">
      <h1>📚 BookShire</h1>

      <Section title="🔥 Top Selling (EN)" books={data.enTrending} />
      <Section title="🆕 Latest (EN)" books={data.enLatest} />
      <Section title="📖 中文新书" books={data.cnLatest} isCN />
    </div>
  );
}

export async function getStaticProps() {
  const data = await fetchBooks();

  return {
    props: { data },
    revalidate: 86400 // 每天更新
  };
}