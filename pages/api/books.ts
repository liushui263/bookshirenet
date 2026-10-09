import type { NextApiHandler } from "next";
import { fetchBooks, type BooksData } from "../../lib/fetchBooks";

const handler: NextApiHandler<BooksData> = async (_req, res) => {
  const data = await fetchBooks();
  // Every call costs ~10 Google Books requests, so let the CDN serve repeats.
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400"
  );
  res.status(200).json(data);
};

export default handler;
