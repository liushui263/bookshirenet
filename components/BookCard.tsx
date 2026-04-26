import Image from "next/image";
import type { Book } from "../lib/fetchBooks";

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  const author = book.authors.join(", ");
  const languageLabel = book.language === "zh" ? "中文" : "EN";
  const publishedLabel = book.publishedDate ?? "Date pending";
  const publishedAt = book.publishedDate
    ? new Date(book.publishedDate).toISOString().slice(0, 10)
    : undefined;

  return (
    <article className="card">
      <div className="card-cover">
        <Image
          className="card-cover-image"
          src={book.cover}
          alt={book.title || "Book cover"}
          width={300}
          height={450}
          sizes="(max-width: 420px) 100vw, (max-width: 820px) 50vw, (max-width: 1280px) 20vw, 240px"
        />
        <span className="card-chip">{languageLabel}</span>
      </div>

      <div className="card-body">
        <p className="card-kicker">
          {publishedAt ? (
            <time dateTime={publishedAt}>{publishedLabel}</time>
          ) : (
            publishedLabel
          )}
        </p>
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
