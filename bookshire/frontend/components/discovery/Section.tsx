import { FALLBACK_COVER, type Book } from "@/lib/discovery/fetchBooks";
import { AddDiscoveryBookButton } from "@/components/discovery/AddDiscoveryBookButton";
import { SpineShelf, type SpineItem } from "@/components/spines/SpineShelf";

const LANGUAGE_NAMES: Record<Book["language"], string> = {
  zh: "中文",
  en: "English",
  fr: "Français",
  es: "Español",
  de: "Deutsch",
  ru: "Русский",
};

function toSpineItem(book: Book): SpineItem {
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
          label: book.id.startsWith("ol-") ? "View on Open Library" : "View on Google Books",
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
              Refreshing...
            </span>
          ) : null}
          <div className="section-count">{books.length} picks</div>
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
          items={books.map(toSpineItem)}
          label={title}
          renderActions={(item) => {
            const book = books.find((entry) => entry.id === item.id);
            return book ? <AddDiscoveryBookButton key={book.id} book={book} signedIn={signedIn} /> : null;
          }}
        />
      ) : (
        <div className="section-empty">
          {emptyMessage ?? "No books available for this shelf yet."}
        </div>
      )}
    </section>
  );
}
