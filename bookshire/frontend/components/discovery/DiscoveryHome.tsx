"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DISCOVERY_GOTO_EVENT } from "@/components/HeaderNav";
import Section from "@/components/discovery/Section";
import { useLocale, useT } from "@/components/LocaleProvider";
import { CATEGORY_IDS, CATEGORY_LABELS } from "@/lib/discovery/categories";
import { countBooks, type Book, type BooksData, type CategoryId } from "@/lib/discovery/fetchBooks";

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

  const locale = useLocale();
  const tr = useT();
  const [zhCategory, setZhCategory] = useState<CategoryId>("fiction");
  const [enCategory, setEnCategory] = useState<CategoryId>("fiction");

  const lastRefreshed = new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: locale !== "zh",
    timeZone: "America/Chicago",
  }).format(new Date(booksData.updatedAt));
  const listUpdatedAt = tr(`Updated ${lastRefreshed} CT`, `更新于 ${lastRefreshed}（美中时间）`);

  const totalBooks = countBooks(booksData);
  const hasBooks = totalBooks > 0;

  const shelfHighlights = [
    booksData.zhNewPublish[0],
    booksData.enNewPublish[0],
    booksData.frBestSellerYear[0],
  ].filter(Boolean);

  const digest = [
    {
      label: tr("Popular in Chinese this week", "本周中文热门"),
      value: booksData.zhBestSellerWeek[0]?.title ?? tr("Popular picks arriving soon", "热门书单正在更新"),
    },
    {
      label: tr("Newest in Chinese", "最新中文小说"),
      value: booksData.zhNewPublish[0]?.title ?? tr("New fiction arriving soon", "中文书单正在更新"),
    },
    {
      label: tr("Newest in English", "最新英文小说"),
      value: booksData.enNewPublish[0]?.title ?? tr("New fiction arriving soon", "英文书单正在更新"),
    },
  ];

  const categoryLabel = (id: CategoryId) => CATEGORY_LABELS[id][locale];

  function newList(language: "zh" | "en", category: CategoryId) {
    const byCategory = language === "zh" ? booksData.zhNewByCategory : booksData.enNewByCategory;
    const fiction = language === "zh" ? booksData.zhNewPublish : booksData.enNewPublish;
    return category === "fiction" ? fiction : byCategory?.[category] ?? [];
  }

  function categoryChips(language: "zh" | "en", active: CategoryId, choose: (id: CategoryId) => void) {
    return (
      <div className="category-chips" role="group" aria-label={tr("Categories", "分类")}>
        {CATEGORY_IDS.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={active === id}
            className={`category-chip${active === id ? " category-chip-active" : ""}`}
            onClick={() => choose(id)}
          >
            {categoryLabel(id)}
            <span className="category-chip-count">{newList(language, id).length}</span>
          </button>
        ))}
      </div>
    );
  }

  const zhName = tr("Chinese", "中文");
  const enName = tr("English", "英文");

  const catalogSections: Array<{
    id: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    books: Book[];
    toolbar?: ReactNode;
    source: string;
  }> = [
    {
      id: "zh-new-publish",
      eyebrow: zhName,
      title: tr(`New Chinese books: ${categoryLabel(zhCategory)}`, `中文新书·${categoryLabel(zhCategory)}`),
      subtitle: tr(
        "Published in the last year, newest first. Pick a category.",
        "近一年出版，按出版日期从新到旧。点选分类查看。"
      ),
      books: newList("zh", zhCategory),
      toolbar: categoryChips("zh", zhCategory, setZhCategory),
      source: tr("Source: Google Books", "来源：Google Books"),
    },
    {
      id: "zh-best-week",
      eyebrow: zhName,
      title: tr("Chinese fiction: popular this week", "中文小说·本周热门"),
      subtitle: tr(
        "Novels published in the last 7 days first, ranked by number of ratings.",
        "近 7 天出版的小说优先，按评分人数排序。"
      ),
      books: booksData.zhBestSellerWeek,
      source: tr("Source: Google Books / Open Library", "来源：Google Books / Open Library"),
    },
    {
      id: "zh-best-month",
      eyebrow: zhName,
      title: tr("Chinese fiction: popular this month", "中文小说·本月热门"),
      subtitle: tr("The last 30 days, not repeated from the week list.", "近 30 天，不与本周榜重复。"),
      books: booksData.zhBestSellerMonth,
      source: tr("Source: Google Books / Open Library", "来源：Google Books / Open Library"),
    },
    {
      id: "zh-best-year",
      eyebrow: zhName,
      title: tr("Chinese fiction: popular this year", "中文小说·年度热门"),
      subtitle: tr("The last year, not repeated from the shorter lists.", "近一年，不与周榜、月榜重复。"),
      books: booksData.zhBestSellerYear,
      source: tr("Source: Google Books / Open Library", "来源：Google Books / Open Library"),
    },
    {
      id: "en-new-publish",
      eyebrow: enName,
      title: tr(`New English books: ${categoryLabel(enCategory)}`, `英文新书·${categoryLabel(enCategory)}`),
      subtitle: tr(
        "Published in the last year, newest first. Pick a category.",
        "近一年出版，按出版日期从新到旧。点选分类查看。"
      ),
      books: newList("en", enCategory),
      toolbar: categoryChips("en", enCategory, setEnCategory),
      source: tr("Source: Google Books", "来源：Google Books"),
    },
    {
      id: "en-best-week",
      eyebrow: enName,
      title: tr("English fiction: popular this week", "英文小说·本周热门"),
      subtitle: tr(
        "Novels published in the last 7 days first, ranked by number of ratings.",
        "近 7 天出版的小说优先，按评分人数排序。"
      ),
      books: booksData.enBestSellerWeek,
      source: tr("Source: Google Books / Open Library", "来源：Google Books / Open Library"),
    },
    {
      id: "en-best-month",
      eyebrow: enName,
      title: tr("English fiction: popular this month", "英文小说·本月热门"),
      subtitle: tr("The last 30 days, not repeated from the week list.", "近 30 天，不与本周榜重复。"),
      books: booksData.enBestSellerMonth,
      source: tr("Source: Google Books / Open Library", "来源：Google Books / Open Library"),
    },
    {
      id: "en-best-year",
      eyebrow: enName,
      title: tr("English fiction: popular this year", "英文小说·年度热门"),
      subtitle: tr("The last year, not repeated from the shorter lists.", "近一年，不与周榜、月榜重复。"),
      books: booksData.enBestSellerYear,
      source: tr("Source: Google Books / Open Library", "来源：Google Books / Open Library"),
    },
    ...(
      [
        ["fr-best-year", "French", "法语", booksData.frBestSellerYear],
        ["es-best-year", "Spanish", "西班牙语", booksData.esBestSellerYear],
        ["de-best-year", "German", "德语", booksData.deBestSellerYear],
        ["ru-best-year", "Russian", "俄语", booksData.ruBestSellerYear],
      ] as const
    ).map(([id, en, zh, books]) => ({
      id,
      eyebrow: tr(en, zh),
      title: tr(`${en} fiction: popular this year`, `${zh}小说·年度热门`),
      subtitle: tr("Popular novels from the last year.", "近一年的热门小说。"),
      books: [...books],
      source: tr("Source: Google Books / Open Library", "来源：Google Books / Open Library"),
    })),
  ];

  const tabSections = {
    zh: catalogSections.slice(0, 4),
    en: catalogSections.slice(4, 8),
    intl: catalogSections.slice(8, 12),
  } as const;

  const statusLabel = hasBooks ? tr("Shelf ready", "书架已更新") : tr("Shelf is empty right now", "书架暂时是空的");

  const statusHint = hasBooks
    ? tr("Lists refresh once a day from Google Books.", "书单每天从 Google Books 更新一次。")
    : tr(
        "The book sources were unavailable at the last refresh. The shelf fills again at the next daily refresh.",
        "上次更新时书源暂时不可用，下次每日更新时会重新上架。"
      );

  const sectionEmptyMessage = hasBooks
    ? tr(
        "No books found for this list right now. Try another category or check back tomorrow.",
        "这个书单暂时没有书，换个分类看看，或者明天再来。"
      )
    : tr(
        "No books returned right now. This can happen during API quota limits or temporary source outages.",
        "书源暂时没有返回书目，可能是接口配额用完或临时故障。"
      );

  return (
    <div className="discovery">
      <div className="page-shell">
        <main className="container" id="top">
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">{tr("Picked with care, refreshed every day", "用心挑选，每日更新")}</p>
              <h1>
                {tr(
                  "Book discovery with a warmer shelf and a quieter magazine feel.",
                  "一面温暖的书墙，像翻一本安静的杂志那样发现好书。"
                )}
              </h1>
              <p className="hero-text">
                {tr(
                  "布客舍书坊 gathers new books in several categories and popular fiction in Chinese, English, French, Spanish, German and Russian into one reading wall, in the spirit of Goodreads and Douban. Add any book to your own shelf to keep track of your reading.",
                  "布客舍书坊把中文、英文、法语、西班牙语、德语和俄语的新书与热门小说汇集到一面书墙上，灵感来自豆瓣和 Goodreads。看到喜欢的书，加入自己的书架，记录你的阅读。"
                )}
              </p>

              <div className="hero-actions">
                <a
                  className="button button-primary"
                  href="#en-new-publish"
                  onClick={(event) => {
                    event.preventDefault();
                    goToSection(locale === "zh" ? "zh-new-publish" : "en-new-publish");
                  }}
                >
                  {tr("Browse new releases", "看看新书")}
                </a>
                <Link
                  className="button button-secondary"
                  href={signedIn ? "/shelf" : "/register"}
                >
                  {signedIn ? tr("Open my shelf", "打开我的书架") : tr("Start your shelf", "建立我的书架")}
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
                  <span className="stat-label">{tr("Books on today's shelf", "今日上架")}</span>
                </article>
                <article className="stat-card">
                  <span className="stat-value">{tr("Daily", "每日")}</span>
                  <span className="stat-label">{tr("Automatic refresh", "自动更新")}</span>
                </article>
                <article className="stat-card">
                  <span className="stat-value">{LANGUAGE_COUNT}</span>
                  <span className="stat-label">{tr("Reading languages", "种阅读语言")}</span>
                </article>
              </div>
            </div>

            <aside className="hero-panel">
              <section className="panel-card spotlight-card">
                <p className="panel-label">{tr("Shelf preview", "书架预览")}</p>
                <h2>{tr("Today's front table", "今日新书台")}</h2>
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
                      {tr("No highlights yet. Keep browsing below.", "还没有推荐，往下看看书单吧。")}
                    </p>
                  )}
                </div>
              </section>

              <section className="panel-card rhythm-card">
                <p className="panel-label">{tr("Reading rhythm", "阅读节奏")}</p>
                <div className="timeline-item">
                  <strong>{tr("Last refresh", "上次更新")}</strong>
                  <span>{tr(`${lastRefreshed} CT`, `${lastRefreshed}（美中时间）`)}</span>
                </div>
                <div className="timeline-item">
                  <strong>{tr("Sources", "书目来源")}</strong>
                  <span>{tr("Google Books, with Open Library as a fallback", "Google Books，Open Library 作为备用")}</span>
                </div>
                <div className="timeline-item">
                  <strong>{tr("Refresh", "更新频率")}</strong>
                  <span>{tr("Once a day", "每天一次")}</span>
                </div>
              </section>
            </aside>
          </section>

          <section className="digest-row" aria-label={tr("Daily highlights", "今日看点")}>
            {digest.map((item) => (
              <article className="digest-card" key={item.label}>
                <span>{item.label}</span>
                <h2>{item.value}</h2>
              </article>
            ))}
          </section>

          <div className="catalog-layout">
            <div className="catalog-main">
              <section className="list-tabs" aria-label={tr("List groups", "书单分组")}>
                <button
                  type="button"
                  className={`list-tab ${activeTab === "zh" ? "list-tab-active" : ""}`}
                  onClick={() => setActiveTab("zh")}
                >
                  {tr("Chinese lists", "中文书单")}
                </button>
                <button
                  type="button"
                  className={`list-tab ${activeTab === "en" ? "list-tab-active" : ""}`}
                  onClick={() => setActiveTab("en")}
                >
                  {tr("English lists", "英文书单")}
                </button>
                <button
                  type="button"
                  className={`list-tab ${activeTab === "intl" ? "list-tab-active" : ""}`}
                  onClick={() => setActiveTab("intl")}
                >
                  {tr("French/Spanish/German/Russian", "法语/西语/德语/俄语")}
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
                  sourceLabel={section.source}
                  updatedAtLabel={listUpdatedAt}
                  signedIn={signedIn}
                  toolbar={section.toolbar}
                  emptyMessage={sectionEmptyMessage}
                />
              ))}
            </div>

            <aside className="catalog-sidebar">
              <section className="sidebar-card">
                <p className="panel-label">{tr("Your library", "我的藏书")}</p>
                <h2>{tr("Keep the books you find.", "把喜欢的书收进书架。")}</h2>
                <p>
                  {signedIn
                    ? tr(
                        "Use + My shelf on any book to add it to your library and track your reading.",
                        "点任意一本书的「加入我的书架」，就能收藏并记录阅读进度。"
                      )
                    : tr(
                        "Create a free account to save books to your shelf and track what you read.",
                        "免费注册一个账号，就能收藏书籍、记录阅读。"
                      )}
                </p>
                <Link className="button button-primary" href={signedIn ? "/shelf" : "/register"}>
                  {signedIn ? tr("Open my shelf", "打开我的书架") : tr("Create account", "注册账号")}
                </Link>
              </section>

              <section className="sidebar-card">
                <p className="panel-label">{tr("Language mix", "语言分布")}</p>
                <div className="sidebar-metrics">
                  <div>
                    <strong>{booksData.zhNewPublish.length}</strong>
                    <span>{tr("New Chinese fiction", "中文新书")}</span>
                  </div>
                  <div>
                    <strong>{booksData.enNewPublish.length}</strong>
                    <span>{tr("New English fiction", "英文新书")}</span>
                  </div>
                  <div>
                    <strong>{booksData.frBestSellerYear.length + booksData.esBestSellerYear.length + booksData.deBestSellerYear.length + booksData.ruBestSellerYear.length}</strong>
                    <span>{tr("French/Spanish/German/Russian", "法西德俄年度热门")}</span>
                  </div>
                </div>
              </section>

              <section className="sidebar-card">
                <p className="panel-label">{tr("About the lists", "书单说明")}</p>
                <ul className="sidebar-list">
                  <li>{tr("New lists show books published in the last year, by category.", "新书榜按分类收录近一年出版的书。")}</li>
                  <li>
                    {tr(
                      "Popular lists rank recent novels by number of Google Books ratings, not sales charts.",
                      "热门榜按 Google Books 评分人数排序，不是销量榜。"
                    )}
                  </li>
                  <li>{tr("Each book appears on only one of a language's popular lists.", "同一本书只会出现在一个热门榜里。")}</li>
                  <li>
                    {tr(
                      "Each book links to its Douban and Goodreads pages for reviews.",
                      "每本书都附有豆瓣和 Goodreads 的链接，方便看书评。"
                    )}
                  </li>
                </ul>
              </section>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
