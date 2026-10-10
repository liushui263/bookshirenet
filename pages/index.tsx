import Head from "next/head";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import { useRouter } from "next/router";
import Section from "../components/Section";
import {
  countBooks,
  fetchBooks,
  type Book,
  type BooksData,
} from "../lib/fetchBooks";

type TabId = "zh" | "en" | "intl";

const LANGUAGE_COUNT = 6;
const ONE_DAY_SECONDS = 60 * 60 * 24;

const TAB_FOR_SECTION: Record<string, TabId> = {
  "zh-new-publish": "zh",
  "en-new-publish": "en",
  "fr-best-year": "intl",
};

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
  const router = useRouter();
  const booksData = data;
  const [activeTab, setActiveTab] = useState<TabId>("zh");
  const [pendingScroll, setPendingScroll] = useState<string | null>(null);

  // Sections only render for the active tab, so in-page links switch the tab
  // first and scroll once the target section exists.
  function goToSection(sectionId: string) {
    setActiveTab(TAB_FOR_SECTION[sectionId] ?? "zh");
    setPendingScroll(sectionId);
  }

  useEffect(() => {
    const hashTarget = window.location.hash.slice(1);
    if (TAB_FOR_SECTION[hashTarget]) {
      goToSection(hashTarget);
    }
  }, []);

  useEffect(() => {
    if (!pendingScroll) {
      return;
    }

    document
      .getElementById(pendingScroll)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    setPendingScroll(null);
  }, [pendingScroll, activeTab]);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const queryTab = router.query.tab;
    if (queryTab === "zh" || queryTab === "en" || queryTab === "intl") {
      setActiveTab(queryTab);
    }
  }, [router.isReady, router.query.tab]);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const currentQueryTab = router.query.tab;
    if (currentQueryTab === activeTab) {
      return;
    }

    const nextQuery = { ...router.query, tab: activeTab };
    router.replace(
      {
        pathname: router.pathname,
        query: nextQuery,
      },
      undefined,
      { shallow: true, scroll: false }
    );
  }, [activeTab, router]);

  const lastRefreshed = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Chicago",
  }).format(new Date(booksData.updatedAt));
  const listUpdatedAt = `Updated ${lastRefreshed} CT`;

  const totalBooks = countBooks(booksData);
  const hasBooks = totalBooks > 0;

  const shelfHighlights = [
    booksData.zhNewPublish[0],
    booksData.enNewPublish[0],
    booksData.frBestSellerYear[0],
  ].filter(Boolean);

  const digest = [
    {
      label: "Popular this week",
      value: booksData.enBestSellerWeek[0]?.title ?? "Popular picks arriving soon",
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
      title: "Chinese: Popular This Week",
      subtitle: "Popular Chinese fiction, preferring titles published in the last 7 days.",
      books: booksData.zhBestSellerWeek,
    },
    {
      id: "zh-best-month",
      eyebrow: "中文",
      title: "Chinese: Popular This Month",
      subtitle: "Popular Chinese fiction from the last 30 days, not repeated from the week list.",
      books: booksData.zhBestSellerMonth,
    },
    {
      id: "zh-best-year",
      eyebrow: "中文",
      title: "Chinese: Popular This Year",
      subtitle: "Popular Chinese fiction from the last year, not repeated from shorter lists.",
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
      title: "English: Popular This Week",
      subtitle: "Popular English fiction, preferring titles published in the last 7 days.",
      books: booksData.enBestSellerWeek,
    },
    {
      id: "en-best-month",
      eyebrow: "English",
      title: "English: Popular This Month",
      subtitle: "Popular English fiction from the last 30 days, not repeated from the week list.",
      books: booksData.enBestSellerMonth,
    },
    {
      id: "en-best-year",
      eyebrow: "English",
      title: "English: Popular This Year",
      subtitle: "Popular English fiction from the last year, not repeated from shorter lists.",
      books: booksData.enBestSellerYear,
    },
    {
      id: "fr-best-year",
      eyebrow: "French",
      title: "French: Popular This Year",
      subtitle: "Popular French fiction, preferring titles from the last year.",
      books: booksData.frBestSellerYear,
    },
    {
      id: "es-best-year",
      eyebrow: "Spanish",
      title: "Spanish: Popular This Year",
      subtitle: "Popular Spanish fiction, preferring titles from the last year.",
      books: booksData.esBestSellerYear,
    },
    {
      id: "de-best-year",
      eyebrow: "German",
      title: "German: Popular This Year",
      subtitle: "Popular German fiction, preferring titles from the last year.",
      books: booksData.deBestSellerYear,
    },
    {
      id: "ru-best-year",
      eyebrow: "Russian",
      title: "Russian: Popular This Year",
      subtitle: "Popular Russian fiction, preferring titles from the last year.",
      books: booksData.ruBestSellerYear,
    },
  ];

  const tabSections = {
    zh: catalogSections.slice(0, 4),
    en: catalogSections.slice(4, 8),
    intl: catalogSections.slice(8, 12),
  } as const;

  const statusLabel = hasBooks
    ? "Shelf ready"
    : "Shelf is empty right now";

  const statusHint = hasBooks
    ? "Lists refresh once a day from Google Books."
    : "The book sources were unavailable at the last refresh. The shelf fills again at the next daily refresh.";

  const sectionEmptyMessage = hasBooks
    ? "No books found for this list right now. Try another tab or check back tomorrow."
    : "No books returned right now. This can happen during API quota limits or temporary source outages.";

  return (
    <>
      <Head>
        <title>BookShire</title>
        <meta
          name="description"
          content="A daily reading shelf of new and popular fiction in Chinese, English, French, Spanish, German and Russian."
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
            {[
              ["zh-new-publish", "中文榜单"],
              ["en-new-publish", "English Lists"],
              ["fr-best-year", "EU Language Lists"],
            ].map(([sectionId, label]) => (
              <a
                key={sectionId}
                href={`#${sectionId}`}
                onClick={(event) => {
                  event.preventDefault();
                  goToSection(sectionId);
                }}
              >
                {label}
              </a>
            ))}
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
                BookShire gathers new and popular fiction in Chinese, English,
                French, Spanish, German and Russian into a single reading wall
                inspired by Goodreads and 豆瓣.
              </p>

              <div className="hero-actions">
                <a
                  className="button button-primary"
                  href="#en-new-publish"
                  onClick={(event) => {
                    event.preventDefault();
                    goToSection("en-new-publish");
                  }}
                >
                  Browse New Releases
                </a>
                <a className="button button-secondary" href="/api/books">
                  Open API Feed
                </a>
              </div>

              <div
                className={`load-status load-status-${hasBooks ? "success" : "error"}`}
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
                  <span className="stat-value">{LANGUAGE_COUNT}</span>
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
                          unoptimized={book.cover.endsWith(".svg")}
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
                  <span>Google Books, with Open Library as a fallback</span>
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
              <section className="list-tabs" aria-label="List groups">
                <button
                  type="button"
                  className={`list-tab ${activeTab === "zh" ? "list-tab-active" : ""}`}
                  onClick={() => setActiveTab("zh")}
                >
                  中文 Lists
                </button>
                <button
                  type="button"
                  className={`list-tab ${activeTab === "en" ? "list-tab-active" : ""}`}
                  onClick={() => setActiveTab("en")}
                >
                  English Lists
                </button>
                <button
                  type="button"
                  className={`list-tab ${activeTab === "intl" ? "list-tab-active" : ""}`}
                  onClick={() => setActiveTab("intl")}
                >
                  French/Spanish/German/Russian
                </button>
              </section>

              {tabSections[activeTab].map((section) => (
                <Section
                  key={section.id}
                  id={section.id}
                  eyebrow={section.eyebrow}
                  title={section.title}
                  subtitle={section.subtitle}
                  books={section.books}
                  sourceLabel={
                    section.id.includes("best")
                      ? "Source: Google Books search (Open Library fallback)"
                      : "Source: Google Books newest"
                  }
                  updatedAtLabel={listUpdatedAt}
                  emptyMessage={sectionEmptyMessage}
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
                  <li>New lists show the most recently published fiction.</li>
                  <li>Popular lists come from Google Books search results, not sales charts.</li>
                  <li>Each book appears on only one of a language&apos;s popular shelves.</li>
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

  if (countBooks(data) === 0) {
    // During a background regeneration, throwing keeps the last good page
    // instead of replacing it with empty shelves.
    if (process.env.NEXT_PHASE !== "phase-production-build") {
      throw new Error("Book sources returned no books; keeping the previous page");
    }

    // At build time there is no previous page, so ship the empty shelf and
    // retry soon.
    return {
      props: { data: toSerializableBooksData(data) },
      revalidate: 60 * 15,
    };
  }

  return {
    props: {
      data: toSerializableBooksData(data),
    },
    revalidate: ONE_DAY_SECONDS,
  };
};
