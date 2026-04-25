export default function BookCard({ book, isCN = false }) {
  const info = isCN ? book : book.volumeInfo;

  const title = isCN ? book.title : info.title;
  const author = isCN
    ? book.author_name?.[0]
    : info.authors?.join(", ");

  const image = isCN
    ? "https://via.placeholder.com/128x180?text=Book"
    : info.imageLinks?.thumbnail;

  return (
    <div className="card">
      <img src={image} />
      <h4>{title}</h4>
      <p>{author}</p>
    </div>
  );
}