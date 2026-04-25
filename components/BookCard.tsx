import type { Book } from "../lib/fetchBooks";

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  const author = book.authors.join(", ");
  const languageLabel = book.language === "zh" ? "中文" : "EN";
  const publishedLabel = book.publishedDate ?? "Unknown date";

  return (
    <div className="card">
      <img src={book.cover} alt={book.title || "Book cover"} />
      <h4>{book.title}</h4>
      <p>{author}</p>
      <p>{publishedLabel}</p>
      <p>{languageLabel}</p>
    </div>
  );
}
