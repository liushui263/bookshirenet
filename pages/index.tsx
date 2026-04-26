import Head from "next/head";
import Image from "next/image";
import { startTransition, useEffect, useState } from "react";
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Section from "../components/Section";
import { fetchBooks, type Book, type BooksData } from "../lib/fetchBooks";

type LoadState = "idle" | "loading" | "success" | "error";

function getTotalBooks(data: BooksData) {
  return data.enTrending.length + data.enLatest.length + data.cnLatest.length;
}

function hasAnyBooks(data: BooksData) {
  return getTotalBooks(data) > 0;
}

function toSerializableBook(book: Book): Book {
  return {
    id: book.id,
    title: book.title,
    authors: [...book.authors],
    cover: book.cover,
    language: book.language,
    ...(book.publishedDate ? { publishedDate: book.publishedDate } : {}),
    ...(book.sourceUrl ? { sourceUrl: book.sourceUrl } : {}),
  };
}

function toSerializableBooksData(data: BooksData): BooksData {
  return {
    enLatest: data.enLatest.map(toSerializableBook),
    cnLatest: data.cnLatest.map(toSerializableBook),
    enTrending: data.enTrending.map(toSerializableBook),
    updatedAt: data.updatedAt,
  };
}

export default function Home({
  data,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const [booksData, setBooksData] = useState(data);
  const [loadState, setLoadState] = useState<LoadState>(
    hasAnyBooks(data) ? "idle" : "loading"
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadBooks() {
      setLoadState("loading");

      try {
        const response = await fetch("/api/books", {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to load books: ${response.status}`);
        }

        const nextData = (await response.json()) as BooksData;

        if (controller.signal.aborted) {
          return;
        }

        if (hasAnyBooks(nextData)) {
          startTransition(() => {
            setBooksData(nextData);
          });
          setLoadState("success");
          return;
        }

        setLoadState(hasAnyBooks(data) ? "success" : "error");
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Failed to load live book lists", error);
        setLoadState(hasAnyBooks(data) ? "success" : "error");
      }
    }

    loadBooks();

    return () => controller.abort();
  }, [data]);

  const lastRefreshed = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Chicago",
  }).format(new Date(booksData.updatedAt));

  const totalBooks = getTotalBooks(booksData);

  const shelfHighlights = [
    booksData.enTrending[0],
    booksData.enLatest[0],
    booksData.cnLatest[0],
  ].filter(Boolean);

  const digest = [
    {
      label: "Bestseller pulse",
      value: booksData.enTrending[0]?.title ?? "Fresh rankings loading",
    },
    {
      label: "Newest in English",
      value: booksData.enLatest[0]?.title ?? "New fiction arriving soon",
    },
    {
      label: "Newest in Chinese",
      value: booksData.cnLatest[0]?.title ?? "中文书单正在更新",
    },
  ];

  const statusLabel =
    loadState === "loading"
      ? "Loading live shelf..."
      : loadState === "error"
        ? "Live fetch failed, showing current shelf"
        : "Live shelf ready";

  const statusHint =
    loadState === "error"
      ? "Data source is temporarily unavailable. Cached books are shown."
      : loadState === "loading"
        ? "Trying to refresh from Google Books."
        : "Fresh or cached content is available for browsing.";

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
            <div className="brand-copy">
                <div className="main-text">
                <div className="line">
                    <strong>BookShire</strong>
                    <em className="special-char">书</em>
                </div>
                <div className="line">
                    <strong>布客舍</strong>
                    <em className="special-char">坊</em>
                </div>
                </div>
                <small>Daily reading shelf</small>
            </div>
            <span className="brand-mark">書</span>
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

              <div
                className={`load-status load-status-${loadState}`}
                role="status"
                aria-live="polite"
              >
                <span className="load-status-dot" aria-hidden="true" />
                <span>{statusLabel}</span>
              </div>
              <p className="load-status-hint">{statusHint}</p>

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
                  {shelfHighlights.length ? (
                    shelfHighlights.map((book) => (
                      <article className="mini-book" key={book.id}>
                        <Image
                          className="mini-book-cover"
                          src={book.cover}
                          alt={book.title}
                          width={62}
                          height={93}
                          sizes="62px"
                        />
                        <div>
                          <strong>{book.title}</strong>
                          <span>{book.authors[0]}</span>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="mini-shelf-empty">
                      No live highlights yet. Keep browsing below.
                    </p>
                  )}
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
                books={booksData.enTrending}
              />
              <Section
                id="latest-en"
                eyebrow="New release wall"
                title="Latest English Fiction"
                subtitle="Fresh arrivals with a cleaner, editorial presentation for browsing at a glance."
                books={booksData.enLatest}
              />
              <Section
                id="latest-zh"
                eyebrow="中文精选"
                title="Chinese New Books"
                subtitle="A quieter 豆瓣-style corner for Chinese-language recent titles."
                books={booksData.cnLatest}
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
                    <strong>{booksData.enTrending.length}</strong>
                    <span>Trending EN</span>
                  </div>
                  <div>
                    <strong>{booksData.enLatest.length}</strong>
                    <span>New EN</span>
                  </div>
                  <div>
                    <strong>{booksData.cnLatest.length}</strong>
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
  const serializableData = toSerializableBooksData(data);

  return {
    props: {
      data: serializableData,
    },
    revalidate: 60 * 60 * 24,
  };
};
