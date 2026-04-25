import type { Book } from "../lib/fetchBooks";

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  const author = book.authors.join(", ");
  const languageLabel = book.language === "zh" ? "中文" : "EN";
  const publishedLabel = book.publishedDate ?? "Date pending";

  return (
    <article className="card">
      <div className="card-cover">
        <img
          src={book.cover}
          alt={book.title || "Book cover"}
          loading="lazy"
          decoding="async"
        />
        <span className="card-chip">{languageLabel}</span>
      </div>

      <div className="card-body">
        <p className="card-kicker">{publishedLabel}</p>
        <h3>{book.title}</h3>
        <p className="card-author">{author}</p>
        {book.sourceUrl ? (
          <a
            className="card-link"
            href={book.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            View source
          </a>
        ) : (
          <span className="card-link card-link-muted">Catalog entry</span>
        )}
      </div>
    </article>
  );
}
