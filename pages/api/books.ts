import type { NextApiHandler } from "next";
import { fetchBooks, type BooksData } from "../../lib/fetchBooks";

const handler: NextApiHandler<BooksData> = async (_req, res) => {
  const data = await fetchBooks();
  res.status(200).json(data);
};

export default handler;
