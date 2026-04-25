import { fetchBooks } from "../../lib/fetchBooks";

export default async function handler(req, res) {
  const data = await fetchBooks();
  res.status(200).json(data);
}