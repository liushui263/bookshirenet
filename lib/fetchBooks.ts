export type BookLanguage = "en" | "zh";

export interface Book {
  id: string;
  title: string;
  authors: string[];
  cover: string;
  language: BookLanguage;
  publishedDate?: string;
  sourceUrl?: string;
}

export interface BooksData {
  enLatest: Book[];
  cnLatest: Book[];
  enTrending: Book[];
  updatedAt: string;
}

interface GoogleBooksVolume {
  id?: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    publishedDate?: string;
    infoLink?: string;
  };
}

interface GoogleBooksResponse {
  items?: GoogleBooksVolume[];
}

const FALLBACK_COVER = "https://via.placeholder.com/128x180?text=Book";

function buildGoogleBooksUrl(params: {
  query: string;
  language: BookLanguage;
  maxResults?: number;
  orderBy?: "newest";
}) {
  const searchParams = new URLSearchParams({
    q: params.query,
    printType: "books",
    maxResults: String(params.maxResults ?? 10),
    langRestrict: params.language,
  });

  if (params.orderBy) {
    searchParams.set("orderBy", params.orderBy);
  }

  return `https://www.googleapis.com/books/v1/volumes?${searchParams.toString()}`;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`Failed to fetch book data from ${url}`, error);
    return null;
  }
}

function toHttps(url?: string) {
  if (!url) {
    return FALLBACK_COVER;
  }

  return url.replace(/^http:\/\//i, "https://");
}

function normalizeGoogleBook(
  item: GoogleBooksVolume,
  language: BookLanguage
): Book | null {
  const info = item.volumeInfo;

  if (!info?.title) {
    return null;
  }

  return {
    id: item.id ?? `${language}-${info.title}`,
    title: info.title,
    authors: info.authors?.length ? info.authors : ["Unknown author"],
    cover: toHttps(info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail),
    language,
    publishedDate: info.publishedDate,
    sourceUrl: info.infoLink,
  };
}

async function fetchGoogleBooks(params: {
  query: string;
  language: BookLanguage;
  orderBy?: "newest";
  maxResults?: number;
}): Promise<Book[]> {
  const url = buildGoogleBooksUrl(params);
  const data = await fetchJson<GoogleBooksResponse>(url);

  return (data?.items ?? [])
    .map((item) => normalizeGoogleBook(item, params.language))
    .filter((item): item is Book => item !== null);
}

export async function fetchLatestEnglishBooks() {
  return fetchGoogleBooks({
    query: "subject:fiction",
    language: "en",
    orderBy: "newest",
  });
}

export async function fetchLatestChineseBooks() {
  return fetchGoogleBooks({
    query: "小说",
    language: "zh",
    orderBy: "newest",
  });
}

export async function fetchTrendingEnglishBooks() {
  return fetchGoogleBooks({
    query: "bestseller",
    language: "en",
  });
}

export async function fetchBooks(): Promise<BooksData> {
  const [enLatest, cnLatest, enTrending] = await Promise.all([
    fetchLatestEnglishBooks(),
    fetchLatestChineseBooks(),
    fetchTrendingEnglishBooks(),
  ]);

  return {
    enLatest,
    cnLatest,
    enTrending,
    updatedAt: new Date().toISOString(),
  };
}
