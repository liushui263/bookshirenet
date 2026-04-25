import type { GoogleBook, OpenLibraryBook } from "../lib/fetchBooks";
import BookCard from "./BookCard";

interface SectionProps {
  title: string;
  books: Array<GoogleBook | OpenLibraryBook>;
  isCN?: boolean;
}

export default function Section({ title, books, isCN = false }: SectionProps) {
  return (
    <div className="section">
      <h2>{title}</h2>
      <div className="grid">
        {books.map((b, i) => (
          <BookCard key={i} book={b} isCN={isCN} />
        ))}
      </div>
    </div>
  );
}
