import Head from "next/head";
import Image from "next/image";
import { startTransition, useEffect, useState } from "react";
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Section from "../components/Section";
import { fetchBooks, type Book, type BooksData } from "../lib/fetchBooks";

type LoadState = "idle" | "loading" | "success" | "error";

function getTotalBooks(data: BooksData) {
  return (
    data.zhNewPublish.length +
    data.zhBestSellerWeek.length +
    data.zhBestSellerMonth.length +
    data.zhBestSellerYear.length +
    data.enNewPublish.length +
    data.enBestSellerWeek.length +
    data.enBestSellerMonth.length +
    data.enBestSellerYear.length +
    data.frBestSellerYear.length +
    data.esBestSellerYear.length +
    data.deBestSellerYear.length +
    data.ruBestSellerYear.length
  );
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
  const cloneBooks = (books: Book[]) => books.map(toSerializableBook);

  return {
    zhNewPublish: cloneBooks(data.zhNewPublish),
    zhBestSellerWeek: cloneBooks(data.zhBestSellerWeek),
    zhBestSellerMonth: cloneBooks(data.zhBestSellerMonth),
    zhBestSellerYear: cloneBooks(data.zhBestSellerYear),
    enNewPublish: cloneBooks(data.enNewPublish),
    enBestSellerWeek: cloneBooks(data.enBestSellerWeek),
    enBestSellerMonth: cloneBooks(data.enBestSellerMonth),
    enBestSellerYear: cloneBooks(data.enBestSellerYear),
    frBestSellerYear: cloneBooks(data.frBestSellerYear),
    esBestSellerYear: cloneBooks(data.esBestSellerYear),
    deBestSellerYear: cloneBooks(data.deBestSellerYear),
    ruBestSellerYear: cloneBooks(data.ruBestSellerYear),
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
    booksData.zhNewPublish[0],
    booksData.enNewPublish[0],
    booksData.frBestSellerYear[0],
  ].filter(Boolean);

  const digest = [
    {
      label: "Bestseller pulse",
      value: booksData.enBestSellerWeek[0]?.title ?? "Fresh rankings loading",
    },
    {
      label: "Newest in English",
      value: booksData.enNewPublish[0]?.title ?? "New fiction arriving soon",
    },
    {
      label: "Newest in Chinese",
      value: booksData.zhNewPublish[0]?.title ?? "中文书单正在更新",
    },
  ];

  const catalogSections: Array<{
    id: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    books: Book[];
  }> = [
    {
      id: "zh-new-publish",
      eyebrow: "中文",
      title: "Chinese: New Publish (Top 10)",
      subtitle: "Newest Chinese-language fiction titles.",
      books: booksData.zhNewPublish,
    },
    {
      id: "zh-best-week",
      eyebrow: "中文",
      title: "Chinese: Best Seller Last 1 Week",
      subtitle: "Recent Chinese best sellers published within the last 7 days.",
      books: booksData.zhBestSellerWeek,
    },
    {
      id: "zh-best-month",
      eyebrow: "中文",
      title: "Chinese: Best Seller Last 1 Month",
      subtitle: "Chinese best sellers within a 30-day publish window.",
      books: booksData.zhBestSellerMonth,
    },
    {
      id: "zh-best-year",
      eyebrow: "中文",
      title: "Chinese: Best Seller Last 1 Year",
      subtitle: "Chinese best sellers within a 365-day publish window.",
      books: booksData.zhBestSellerYear,
    },
    {
      id: "en-new-publish",
      eyebrow: "English",
      title: "English: New Publish (Top 10)",
      subtitle: "Newest English fiction titles.",
      books: booksData.enNewPublish,
    },
    {
      id: "en-best-week",
      eyebrow: "English",
      title: "English: Best Seller Last 1 Week",
      subtitle: "Recent English best sellers published within 7 days.",
      books: booksData.enBestSellerWeek,
    },
    {
      id: "en-best-month",
      eyebrow: "English",
      title: "English: Best Seller Last 1 Month",
      subtitle: "English best sellers within a 30-day publish window.",
      books: booksData.enBestSellerMonth,
    },
    {
      id: "en-best-year",
      eyebrow: "English",
      title: "English: Best Seller Last 1 Year",
      subtitle: "English best sellers within a 365-day publish window.",
      books: booksData.enBestSellerYear,
    },
    {
      id: "fr-best-year",
      eyebrow: "French",
      title: "French: Best Seller Last 1 Year",
      subtitle: "French best sellers within a 365-day publish window.",
      books: booksData.frBestSellerYear,
    },
    {
      id: "es-best-year",
      eyebrow: "Spanish",
      title: "Spanish: Best Seller Last 1 Year",
      subtitle: "Spanish best sellers within a 365-day publish window.",
      books: booksData.esBestSellerYear,
    },
    {
      id: "de-best-year",
      eyebrow: "German",
      title: "German: Best Seller Last 1 Year",
      subtitle: "German best sellers within a 365-day publish window.",
      books: booksData.deBestSellerYear,
    },
    {
      id: "ru-best-year",
      eyebrow: "Russian",
      title: "Russian: Best Seller Last 1 Year",
      subtitle: "Russian best sellers within a 365-day publish window.",
      books: booksData.ruBestSellerYear,
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
            <a href="#zh-new-publish">中文榜单</a>
            <a href="#en-new-publish">English Lists</a>
            <a href="#fr-best-year">EU Language Lists</a>
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
              {catalogSections.map((section) => (
                <Section
                  key={section.id}
                  id={section.id}
                  eyebrow={section.eyebrow}
                  title={section.title}
                  subtitle={section.subtitle}
                  books={section.books}
                  isRefreshing={loadState === "loading"}
                />
              ))}
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
                    <strong>{booksData.zhNewPublish.length}</strong>
                    <span>中文新书</span>
                  </div>
                  <div>
                    <strong>{booksData.enNewPublish.length}</strong>
                    <span>English New</span>
                  </div>
                  <div>
                    <strong>{booksData.frBestSellerYear.length + booksData.esBestSellerYear.length + booksData.deBestSellerYear.length + booksData.ruBestSellerYear.length}</strong>
                    <span>EU/RU yearly best</span>
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
