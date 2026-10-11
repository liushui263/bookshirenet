import { FALLBACK_COVER, type Book } from "@/lib/discovery/fetchBooks";
import { AddDiscoveryBookButton } from "@/components/discovery/AddDiscoveryBookButton";
import { SpineShelf, type ShelfLocale, type SpineItem } from "@/components/spines/SpineShelf";

const LANGUAGE_NAMES: Record<Book["language"], string> = {
  zh: "中文",
  en: "English",
  fr: "Français",
  es: "Español",
  de: "Deutsch",
  ru: "Русский",
};

function toSpineItem(book: Book, locale: ShelfLocale): SpineItem {
  return {
    id: book.id,
    title: book.title,
    authors: book.authors.filter((author) => author !== "Unknown author"),
    cover: book.cover === FALLBACK_COVER ? null : book.cover,
    publisher: book.publisher,
    published: book.publishedDate,
    isbn: book.isbn,
    pages: book.pageCount,
    language: LANGUAGE_NAMES[book.language],
    description: book.description,
    link: book.sourceUrl
      ? {
          href: book.sourceUrl,
          label: `${locale === "zh" ? "在" : "View on"} ${book.id.startsWith("ol-") ? "Open Library" : "Google Books"}${locale === "zh" ? " 查看" : ""}`,
          external: true,
        }
      : undefined,
  };
}

interface SectionProps {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  books: Book[];
  signedIn: boolean;
  isRefreshing?: boolean;
  sourceLabel?: string;
  updatedAtLabel?: string;
  emptyMessage?: string;
  locale?: ShelfLocale;
}

export default function Section({
  id,
  eyebrow,
  title,
  subtitle,
  books,
  signedIn,
  isRefreshing = false,
  sourceLabel,
  updatedAtLabel,
  emptyMessage,
  locale = "en",
}: SectionProps) {
  const sectionLabelId = id ? `${id}-title` : undefined;
  const showSkeleton = isRefreshing && books.length === 0;

  return (
    <section className="section" id={id} aria-labelledby={sectionLabelId}>
      <div className="section-header">
        <div>
          {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
          <h2 id={sectionLabelId}>{title}</h2>
          {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
        </div>
        <div className="section-meta">
          {sourceLabel ? (
            <span className="section-source" title={sourceLabel}>
              {sourceLabel}
            </span>
          ) : null}
          {updatedAtLabel ? (
            <span className="section-updated">{updatedAtLabel}</span>
          ) : null}
          {isRefreshing ? (
            <span className="section-refreshing" aria-live="polite">
              {locale === "zh" ? "正在更新…" : "Refreshing..."}
            </span>
          ) : null}
          <div className="section-count">
            {locale === "zh" ? `${books.length} 本` : `${books.length} picks`}
          </div>
        </div>
      </div>
      {showSkeleton ? (
        <div className="grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <article className="card card-skeleton" key={`skeleton-${index}`}>
              <div className="card-cover card-skeleton-cover" />
              <div className="card-body">
                <span className="card-skeleton-line card-skeleton-line-short" />
                <span className="card-skeleton-line" />
                <span className="card-skeleton-line card-skeleton-line-wide" />
              </div>
            </article>
          ))}
        </div>
      ) : books.length ? (
        <SpineShelf
          items={books.map((book) => toSpineItem(book, locale))}
          label={title}
          locale={locale}
          renderActions={(item) => {
            const book = books.find((entry) => entry.id === item.id);
            return book ? <AddDiscoveryBookButton key={book.id} book={book} signedIn={signedIn} locale={locale} /> : null;
          }}
        />
      ) : (
        <div className="section-empty">
          {emptyMessage ?? (locale === "zh" ? "这个书单暂时还没有书。" : "No books available for this shelf yet.")}
        </div>
      )}
    </section>
  );
}
