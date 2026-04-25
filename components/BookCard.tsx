import type { GoogleBook, OpenLibraryBook } from "../lib/fetchBooks";

interface BookCardProps {
  book: GoogleBook | OpenLibraryBook;
  isCN?: boolean;
}

export default function BookCard({ book, isCN = false }: BookCardProps) {
  const googleBook = book as GoogleBook;
  const cnBook = book as OpenLibraryBook;
  const info = googleBook.volumeInfo ?? {};

  const title = isCN ? cnBook.title : info.title;
  const author = isCN ? cnBook.author_name?.[0] : info.authors?.join(", ");

  const image = isCN
    ? "https://via.placeholder.com/128x180?text=Book"
    : info.imageLinks?.thumbnail ?? "https://via.placeholder.com/128x180?text=Book";

  return (
    <div className="card">
      <img src={image} alt={title || "Book cover"} />
      <h4>{title}</h4>
      <p>{author}</p>
    </div>
  );
}
