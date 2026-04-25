import type { Book } from "../lib/fetchBooks";
import BookCard from "./BookCard";

interface SectionProps {
  title: string;
  books: Book[];
}

export default function Section({ title, books }: SectionProps) {
  return (
    <div className="section">
      <h2>{title}</h2>
      <div className="grid">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
}
