export type BookLanguage = "en" | "zh" | "fr" | "es" | "de" | "ru";

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
  zhNewPublish: Book[];
  zhBestSellerWeek: Book[];
  zhBestSellerMonth: Book[];
  zhBestSellerYear: Book[];
  enNewPublish: Book[];
  enBestSellerWeek: Book[];
  enBestSellerMonth: Book[];
  enBestSellerYear: Book[];
  frBestSellerYear: Book[];
  esBestSellerYear: Book[];
  deBestSellerYear: Book[];
  ruBestSellerYear: Book[];
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
const GOOGLE_BOOKS_ENDPOINT = "https://www.googleapis.com/books/v1/volumes";
const REQUEST_TIMEOUT_MS = 8000;
const MAX_RETRIES = 2;
const LIST_SIZE = 10;
const RETRYABLE_HTTP_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const RETRYABLE_ERROR_CODES = new Set([
  "EAI_AGAIN",
  "ECONNRESET",
  "ENOTFOUND",
  "ETIMEDOUT",
]);

function getGoogleBooksApiKey() {
  return process.env.GOOGLE_BOOKS_API_KEY;
}

function buildGoogleBooksUrl(params: {
  query: string;
  language: BookLanguage;
  maxResults?: number;
  orderBy?: "newest";
}) {
  const apiKey = getGoogleBooksApiKey();

  if (!apiKey) {
    return null;
  }

  const searchParams = new URLSearchParams({
    q: params.query,
    printType: "books",
    maxResults: String(params.maxResults ?? 10),
    langRestrict: params.language,
  });

  if (params.orderBy) {
    searchParams.set("orderBy", params.orderBy);
  }

  searchParams.set("key", apiKey);
  return `${GOOGLE_BOOKS_ENDPOINT}?${searchParams.toString()}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorCode(error: unknown) {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const maybeCode = (error as { code?: string }).code;
  if (typeof maybeCode === "string") {
    return maybeCode;
  }

  const cause = (error as { cause?: { code?: string } }).cause;
  if (cause && typeof cause.code === "string") {
    return cause.code;
  }

  return undefined;
}

function shouldRetry(error: unknown, status?: number) {
  if (typeof status === "number" && RETRYABLE_HTTP_STATUS.has(status)) {
    return true;
  }

  const code = getErrorCode(error);
  return code ? RETRYABLE_ERROR_CODES.has(code) : false;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
      });

      if (!response.ok) {
        const status = response.status;
        const error = new Error(`Request failed with status ${status}`);

        if (attempt < MAX_RETRIES && shouldRetry(error, status)) {
          await sleep(250 * (attempt + 1));
          continue;
        }

        console.error(`Book API request failed with status ${status}`, {
          url,
          attempt: attempt + 1,
        });
        return null;
      }

      return (await response.json()) as T;
    } catch (error) {
      const code = getErrorCode(error);
      const canRetry = attempt < MAX_RETRIES && shouldRetry(error);

      if (canRetry) {
        await sleep(250 * (attempt + 1));
        continue;
      }

      console.error("Failed to fetch book data after retries", {
        url,
        attempt: attempt + 1,
        code,
        error,
      });
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  console.error(`Failed to fetch book data from ${url}: retries exhausted`);
  return null;
}

let missingApiKeyWarned = false;

function ensureApiKey(): boolean {
  if (getGoogleBooksApiKey()) {
    return true;
  }

  if (!missingApiKeyWarned) {
    console.error(
      "GOOGLE_BOOKS_API_KEY is not set. Returning empty lists for Google Books queries."
    );
    missingApiKeyWarned = true;
  }

  return false;
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
  if (!ensureApiKey()) {
    return [];
  }

  const url = buildGoogleBooksUrl(params);
  if (!url) {
    return [];
  }

  const data = await fetchJson<GoogleBooksResponse>(url);

  return (data?.items ?? [])
    .map((item) => normalizeGoogleBook(item, params.language))
    .filter((item): item is Book => item !== null);
}

function parsePublishedDate(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function filterByRecentDays(books: Book[], days: number) {
  const now = Date.now();
  const maxAge = days * 24 * 60 * 60 * 1000;

  return books.filter((book) => {
    const publishedDate = parsePublishedDate(book.publishedDate);
    if (!publishedDate) {
      return false;
    }
    return now - publishedDate.getTime() <= maxAge;
  });
}

function takeTop(books: Book[], size = LIST_SIZE) {
  return books.slice(0, size);
}

async function fetchNewPublishBooks(language: BookLanguage, query: string) {
  return fetchGoogleBooks({
    query,
    language,
    orderBy: "newest",
    maxResults: LIST_SIZE,
  });
}

async function fetchBestSellerPool(language: BookLanguage, query: string) {
  return fetchGoogleBooks({
    query,
    language,
    maxResults: 40,
  });
}

async function fetchBestSellerByPeriod(params: {
  language: BookLanguage;
  query: string;
  days: number;
}) {
  const pool = await fetchBestSellerPool(params.language, params.query);
  return takeTop(filterByRecentDays(pool, params.days));
}

export async function fetchBooks(): Promise<BooksData> {
  const [
    zhNewPublish,
    zhBestSellerWeek,
    zhBestSellerMonth,
    zhBestSellerYear,
    enNewPublish,
    enBestSellerWeek,
    enBestSellerMonth,
    enBestSellerYear,
    frBestSellerYear,
    esBestSellerYear,
    deBestSellerYear,
    ruBestSellerYear,
  ] = await Promise.all([
    fetchNewPublishBooks("zh", "小说"),
    fetchBestSellerByPeriod({
      language: "zh",
      query: "畅销 小说",
      days: 7,
    }),
    fetchBestSellerByPeriod({
      language: "zh",
      query: "畅销 小说",
      days: 30,
    }),
    fetchBestSellerByPeriod({
      language: "zh",
      query: "畅销 小说",
      days: 365,
    }),
    fetchNewPublishBooks("en", "subject:fiction"),
    fetchBestSellerByPeriod({
      language: "en",
      query: "bestseller fiction",
      days: 7,
    }),
    fetchBestSellerByPeriod({
      language: "en",
      query: "bestseller fiction",
      days: 30,
    }),
    fetchBestSellerByPeriod({
      language: "en",
      query: "bestseller fiction",
      days: 365,
    }),
    fetchBestSellerByPeriod({
      language: "fr",
      query: "bestseller fiction",
      days: 365,
    }),
    fetchBestSellerByPeriod({
      language: "es",
      query: "bestseller fiction",
      days: 365,
    }),
    fetchBestSellerByPeriod({
      language: "de",
      query: "bestseller fiction",
      days: 365,
    }),
    fetchBestSellerByPeriod({
      language: "ru",
      query: "bestseller fiction",
      days: 365,
    }),
  ]);

  return {
    zhNewPublish: takeTop(zhNewPublish),
    zhBestSellerWeek: takeTop(zhBestSellerWeek),
    zhBestSellerMonth: takeTop(zhBestSellerMonth),
    zhBestSellerYear: takeTop(zhBestSellerYear),
    enNewPublish: takeTop(enNewPublish),
    enBestSellerWeek: takeTop(enBestSellerWeek),
    enBestSellerMonth: takeTop(enBestSellerMonth),
    enBestSellerYear: takeTop(enBestSellerYear),
    frBestSellerYear: takeTop(frBestSellerYear),
    esBestSellerYear: takeTop(esBestSellerYear),
    deBestSellerYear: takeTop(deBestSellerYear),
    ruBestSellerYear: takeTop(ruBestSellerYear),
    updatedAt: new Date().toISOString(),
  };
}
