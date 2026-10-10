"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DISCOVERY_GOTO_EVENT } from "@/components/HeaderNav";
import Section from "@/components/discovery/Section";
import { countBooks, type Book, type BooksData } from "@/lib/discovery/fetchBooks";

export type TabId = "zh" | "en" | "intl";

const LANGUAGE_COUNT = 6;

const TAB_FOR_SECTION: Record<string, TabId> = {
  "zh-new-publish": "zh",
  "en-new-publish": "en",
  "fr-best-year": "intl",
};

type DiscoveryHomeProps = {
  data: BooksData;
  signedIn: boolean;
  initialTab: TabId;
};

export default function DiscoveryHome({ data, signedIn, initialTab }: DiscoveryHomeProps) {
  const router = useRouter();
  const booksData = data;
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  // Sections only render for the active tab, so in-page links switch the tab
  // first and scroll once React has rendered the target section.
  function goToSection(sectionId: string) {
    setActiveTab(TAB_FOR_SECTION[sectionId] ?? "zh");
    window.setTimeout(() => {
      document
        .getElementById(sectionId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  // Old links like bookshire.net/#en-new-publish still open the right tab.
  useEffect(() => {
    const hashTarget = window.location.hash.slice(1);
    if (!TAB_FOR_SECTION[hashTarget]) {
      return;
    }
    const timer = window.setTimeout(() => goToSection(hashTarget), 0);
    return () => window.clearTimeout(timer);
  }, []);

  // List links in the site header.
  useEffect(() => {
    function onGoto(event: Event) {
      const sectionId = (event as CustomEvent<string>).detail;
      if (TAB_FOR_SECTION[sectionId]) goToSection(sectionId);
    }
    window.addEventListener(DISCOVERY_GOTO_EVENT, onGoto);
    return () => window.removeEventListener(DISCOVERY_GOTO_EVENT, onGoto);
  }, []);

  // Keep ?tab= in the address bar so a shared link opens the same tab.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("tab") === activeTab) {
      return;
    }
    url.searchParams.set("tab", activeTab);
    router.replace(`${url.pathname}${url.search}`, { scroll: false });
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
    <div className="discovery">
      <div className="page-shell">
        <main className="container" id="top">
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">Editorially framed, automatically refreshed</p>
              <h1>Book discovery with a warmer shelf and a quieter magazine feel.</h1>
              <p className="hero-text">
                BookShire gathers new and popular fiction in Chinese, English,
                French, Spanish, German and Russian into a single reading wall
                inspired by Goodreads and 豆瓣. Add any book to your own shelf
                to keep track of your reading.
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
                <Link
                  className="button button-secondary"
                  href={signedIn ? "/shelf" : "/register"}
                >
                  {signedIn ? "Open My Shelf" : "Start your shelf"}
                </Link>
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
                  <span>Refreshed once a day</span>
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
                  signedIn={signedIn}
                  emptyMessage={sectionEmptyMessage}
                />
              ))}
            </div>

            <aside className="catalog-sidebar">
              <section className="sidebar-card">
                <p className="panel-label">Your Library</p>
                <h2>Keep the books you find.</h2>
                <p>
                  {signedIn
                    ? "Use + My shelf on any book to add it to your library and track your reading."
                    : "Create a free account to save books to your shelf and track what you read."}
                </p>
                <Link className="button button-primary" href={signedIn ? "/shelf" : "/register"}>
                  {signedIn ? "Open My Shelf" : "Create account"}
                </Link>
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
    </div>
  );
}
