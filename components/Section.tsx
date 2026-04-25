import BookCard from "./BookCard";

export default function Section({ title, books, isCN }) {
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