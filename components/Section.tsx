import type { Book } from "../lib/fetchBooks";
import BookCard from "./BookCard";

interface SectionProps {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  books: Book[];
  isRefreshing?: boolean;
}

export default function Section({
  id,
  eyebrow,
  title,
  subtitle,
  books,
  isRefreshing = false,
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
          {isRefreshing ? (
            <span className="section-refreshing" aria-live="polite">
              Refreshing...
            </span>
          ) : null}
          <div className="section-count">{books.length} picks</div>
        </div>
      </div>
      <div className="grid">
        {showSkeleton ? (
          Array.from({ length: 6 }).map((_, index) => (
            <article className="card card-skeleton" key={`skeleton-${index}`}>
              <div className="card-cover card-skeleton-cover" />
              <div className="card-body">
                <span className="card-skeleton-line card-skeleton-line-short" />
                <span className="card-skeleton-line" />
                <span className="card-skeleton-line card-skeleton-line-wide" />
              </div>
            </article>
          ))
        ) : books.length ? (
          books.map((book) => <BookCard key={book.id} book={book} />)
        ) : (
          <div className="section-empty">No books available for this shelf yet.</div>
        )}
      </div>
    </section>
  );
}
