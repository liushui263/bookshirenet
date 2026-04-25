import type { NextApiHandler } from "next";
import { fetchBooks, type BooksData } from "../../lib/fetchBooks";

const handler: NextApiHandler<BooksData> = async (_req, res) => {
  const data = await fetchBooks();
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).json(data);
};

export default handler;
