import type { Book } from "../lib/fetchBooks";
import BookCard from "./BookCard";

interface SectionProps {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  books: Book[];
}

export default function Section({
  id,
  eyebrow,
  title,
  subtitle,
  books,
}: SectionProps) {
  const sectionLabelId = id ? `${id}-title` : undefined;

  return (
    <section className="section" id={id} aria-labelledby={sectionLabelId}>
      <div className="section-header">
        <div>
          {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
          <h2 id={sectionLabelId}>{title}</h2>
          {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
        </div>
        <div className="section-count">{books.length} picks</div>
      </div>
      <div className="grid">
        {books.length ? (
          books.map((book) => <BookCard key={book.id} book={book} />)
        ) : (
          <div className="section-empty">No books available for this shelf yet.</div>
        )}
      </div>
    </section>
  );
}
