import Image from "next/image";
import type { Book } from "../lib/fetchBooks";

interface BookCardProps {
  book: Book;
  maxTitleLength?: number;
}

function truncateTitle(title: string, maxLength: number = 80): string {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength).trim() + "...";
}

export default function BookCard({ book, maxTitleLength = 80 }: BookCardProps) {
  const author = book.authors.join(", ");
  const displayTitle = truncateTitle(book.title, maxTitleLength);
  const languageLabelMap: Record<Book["language"], string> = {
    zh: "中文",
    en: "EN",
    fr: "FR",
    es: "ES",
    de: "DE",
    ru: "RU",
  };
  const languageLabel = languageLabelMap[book.language];
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
        <h3>{displayTitle}</h3>
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
