import { unstable_cache } from "next/cache";
import { countBooks, fetchBooks, type BooksData } from "@/lib/discovery/fetchBooks";

export const DISCOVERY_CACHE_TAG = "discovery-books";
const ONE_DAY_SECONDS = 60 * 60 * 24;

// One refresh costs about thirty Google Books queries, so the shelves are
// fetched at most once a day and shared by every visitor. An empty result
// throws so the previous day's shelves stay in the cache instead.
const getCachedBooks = unstable_cache(
  async () => {
    const data = await fetchBooks();
    if (countBooks(data) === 0) {
      throw new Error("Book sources returned no books");
    }
    return data;
  },
  ["discovery-books-v5"],
  { revalidate: ONE_DAY_SECONDS, tags: [DISCOVERY_CACHE_TAG] }
);

const EMPTY: Omit<BooksData, "updatedAt"> = {
  zhNewPublish: [],
  zhNewByCategory: {},
  zhBestSellerWeek: [],
  zhBestSellerMonth: [],
  zhBestSellerYear: [],
  enNewPublish: [],
  enNewByCategory: {},
  enBestSellerWeek: [],
  enBestSellerMonth: [],
  enBestSellerYear: [],
  frBestSellerYear: [],
  esBestSellerYear: [],
  deBestSellerYear: [],
  ruBestSellerYear: [],
};

export async function getDiscoveryBooks(): Promise<BooksData> {
  try {
    return await getCachedBooks();
  } catch (error) {
    console.error("Discovery shelves unavailable", error);
    return { ...EMPTY, updatedAt: new Date().toISOString() };
  }
}
