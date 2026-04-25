import Head from "next/head";
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Section from "../components/Section";
import { fetchBooks, type BooksData } from "../lib/fetchBooks";

export default function Home({
  data,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const lastRefreshed = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Chicago",
  }).format(new Date(data.updatedAt));

  const totalBooks =
    data.enTrending.length + data.enLatest.length + data.cnLatest.length;

  const shelfHighlights = [
    data.enTrending[0],
    data.enLatest[0],
    data.cnLatest[0],
  ].filter(Boolean);

  const digest = [
    {
      label: "Bestseller pulse",
      value: data.enTrending[0]?.title ?? "Fresh rankings loading",
    },
    {
      label: "Newest in English",
      value: data.enLatest[0]?.title ?? "New fiction arriving soon",
    },
    {
      label: "Newest in Chinese",
      value: data.cnLatest[0]?.title ?? "中文书单正在更新",
    },
  ];

  return (
    <>
      <Head>
        <title>BookShire</title>
        <meta
          name="description"
          content="A daily reading shelf for English bestsellers, new releases, and Chinese fiction picks."
        />
      </Head>

      <div className="page-shell">
        <header className="topbar">
          <a className="brand" href="#top">
            <span className="brand-mark">B</span>
            <span className="brand-copy">
              <strong>BookShire</strong>
              <small>Daily reading shelf</small>
            </span>
          </a>

          <nav className="topnav" aria-label="Primary">
            <a href="#trending-en">Bestsellers</a>
            <a href="#latest-en">New in English</a>
            <a href="#latest-zh">中文新书</a>
          </nav>

          <a className="toplink" href="/api/books">
            JSON Feed
          </a>
        </header>

        <main className="container" id="top">
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">Editorially framed, automatically refreshed</p>
              <h1>Book discovery with a warmer shelf and a quieter magazine feel.</h1>
              <p className="hero-text">
                BookShire curates English bestsellers, fresh English fiction, and
                Chinese new books into a single reading wall inspired by Goodreads
                and 豆瓣.
              </p>

              <div className="hero-actions">
                <a className="button button-primary" href="#latest-en">
                  Browse New Releases
                </a>
                <a className="button button-secondary" href="/api/books">
                  Open API Feed
                </a>
              </div>

              <div className="hero-stats">
                <article className="stat-card">
                  <span className="stat-value">{totalBooks}</span>
                  <span className="stat-label">Books on today&apos;s shelf</span>
                </article>
                <article className="stat-card">
                  <span className="stat-value">Daily</span>
                  <span className="stat-label">Automatic refresh cadence</span>
                </article>
                <article className="stat-card">
                  <span className="stat-value">2</span>
                  <span className="stat-label">Reading languages tracked</span>
                </article>
              </div>
            </div>

            <aside className="hero-panel">
              <section className="panel-card spotlight-card">
                <p className="panel-label">Shelf Preview</p>
                <h2>Today&apos;s front table</h2>
                <div className="mini-shelf">
                  {shelfHighlights.map((book) => (
                    <article className="mini-book" key={book.id}>
                      <img src={book.cover} alt={book.title} />
                      <div>
                        <strong>{book.title}</strong>
                        <span>{book.authors[0]}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="panel-card rhythm-card">
                <p className="panel-label">Reading Rhythm</p>
                <div className="timeline-item">
                  <strong>Last refresh</strong>
                  <span>{lastRefreshed} CT</span>
                </div>
                <div className="timeline-item">
                  <strong>Source mix</strong>
                  <span>English bestsellers + English and Chinese new books</span>
                </div>
                <div className="timeline-item">
                  <strong>Publishing flow</strong>
                  <span>ISR + daily Vercel cron refresh</span>
                </div>
              </section>
            </aside>
          </section>

          <section className="digest-row" aria-label="Daily highlights">
            {digest.map((item) => (
              <article className="digest-card" key={item.label}>
                <span>{item.label}</span>
                <h2>{item.value}</h2>
              </article>
            ))}
          </section>

          <div className="catalog-layout">
            <div className="catalog-main">
              <Section
                id="trending-en"
                eyebrow="Chart movers"
                title="Top Selling English Books"
                subtitle="The high-visibility shelf: books that feel closest to a Goodreads bestseller strip."
                books={data.enTrending}
              />
              <Section
                id="latest-en"
                eyebrow="New release wall"
                title="Latest English Fiction"
                subtitle="Fresh arrivals with a cleaner, editorial presentation for browsing at a glance."
                books={data.enLatest}
              />
              <Section
                id="latest-zh"
                eyebrow="中文精选"
                title="Chinese New Books"
                subtitle="A quieter 豆瓣-style corner for Chinese-language recent titles."
                books={data.cnLatest}
              />
            </div>

            <aside className="catalog-sidebar">
              <section className="sidebar-card">
                <p className="panel-label">Mood</p>
                <h2>Built like a reading room, not a dashboard.</h2>
                <p>
                  Warm paper tones, upright covers, compact metadata, and curated
                  spacing make the page feel closer to a bookstore display than a
                  generic app grid.
                </p>
              </section>

              <section className="sidebar-card">
                <p className="panel-label">Language Mix</p>
                <div className="sidebar-metrics">
                  <div>
                    <strong>{data.enTrending.length}</strong>
                    <span>Trending EN</span>
                  </div>
                  <div>
                    <strong>{data.enLatest.length}</strong>
                    <span>New EN</span>
                  </div>
                  <div>
                    <strong>{data.cnLatest.length}</strong>
                    <span>中文新书</span>
                  </div>
                </div>
              </section>

              <section className="sidebar-card">
                <p className="panel-label">Collection Notes</p>
                <ul className="sidebar-list">
                  <li>Cards now surface language, publication date, and source links.</li>
                  <li>The homepage is split into a hero, digest band, and shelf sections.</li>
                  <li>Global styling now loads through the Pages Router app shell.</li>
                </ul>
              </section>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps<{ data: BooksData }> = async () => {
  const data = await fetchBooks();

  return {
    props: { data },
    revalidate: 86400, // 每天更新一次，cron 也会主动触发刷新
  };
};
