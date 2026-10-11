export type BookLanguage = "en" | "zh" | "fr" | "es" | "de" | "ru";

export interface Book {
  id: string;
  title: string;
  authors: string[];
  cover: string;
  language: BookLanguage;
  publishedDate?: string;
  sourceUrl?: string;
  publisher?: string;
  isbn?: string;
  pageCount?: number;
  description?: string;
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
    publisher?: string;
    description?: string;
    pageCount?: number;
    industryIdentifiers?: { type?: string; identifier?: string }[];
  };
}

interface GoogleBooksResponse {
  items?: GoogleBooksVolume[];
}

interface OpenLibraryWork {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  language?: string[];
  publisher?: string[];
  isbn?: string[];
  number_of_pages_median?: number;
}

interface OpenLibrarySearchResponse {
  docs?: OpenLibraryWork[];
}

export const FALLBACK_COVER = "/cover-placeholder.svg";
const GOOGLE_BOOKS_ENDPOINT = "https://www.googleapis.com/books/v1/volumes";
const OPEN_LIBRARY_SEARCH_ENDPOINT = "https://openlibrary.org/search.json";
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

async function fetchJson<T>(url: string, headers?: HeadersInit): Promise<T | null> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers,
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

function getOpenLibraryLanguageCode(language: BookLanguage) {
  switch (language) {
    case "zh":
      return "chi";
    case "en":
      return "eng";
    case "fr":
      return "fre";
    case "es":
      return "spa";
    case "de":
      return "ger";
    case "ru":
      return "rus";
    default:
      return "eng";
  }
}

function buildOpenLibrarySearchUrl(params: {
  language: BookLanguage;
  subject?: string;
  limit?: number;
  sort?: "editions" | "new";
}) {
  const languageCode = getOpenLibraryLanguageCode(params.language);
  const query = params.subject
    ? `subject:${params.subject} language:${languageCode}`
    : `language:${languageCode}`;

  const searchParams = new URLSearchParams({
    q: query,
    limit: String(params.limit ?? 40),
    fields: "key,title,author_name,first_publish_year,cover_i,language,publisher,isbn,number_of_pages_median",
  });

  if (params.sort) {
    searchParams.set("sort", params.sort);
  }

  return `${OPEN_LIBRARY_SEARCH_ENDPOINT}?${searchParams.toString()}`;
}

function normalizeOpenLibraryBook(
  item: OpenLibraryWork,
  language: BookLanguage
): Book | null {
  if (!item.title || !item.key) {
    return null;
  }

  const cover = item.cover_i
    ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg`
    : FALLBACK_COVER;

  return {
    id: `ol-${item.key}`,
    title: cleanTitle(item.title),
    authors: item.author_name?.length ? item.author_name : ["Unknown author"],
    cover,
    language,
    publishedDate: item.first_publish_year
      ? `${item.first_publish_year}-01-01`
      : undefined,
    sourceUrl: `https://openlibrary.org${item.key}`,
    ...(item.publisher?.[0] ? { publisher: item.publisher[0] } : {}),
    ...(pickIsbn(item.isbn) ? { isbn: pickIsbn(item.isbn) } : {}),
    ...(item.number_of_pages_median ? { pageCount: item.number_of_pages_median } : {}),
  };
}

const HTML_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", mdash: "—", ndash: "–",
  ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’", middot: "·",
};

// Windows-1252 characters that stand in for bytes 0x80–0x9f when UTF-8 text
// was decoded with the wrong code page.
const CP1252_BYTES: Record<string, number> = {
  "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84, "…": 0x85, "†": 0x86, "‡": 0x87, "ˆ": 0x88,
  "‰": 0x89, "Š": 0x8a, "‹": 0x8b, "Œ": 0x8c, "Ž": 0x8e, "‘": 0x91, "’": 0x92, "“": 0x93,
  "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97, "˜": 0x98, "™": 0x99, "š": 0x9a, "›": 0x9b,
  "œ": 0x9c, "ž": 0x9e, "Ÿ": 0x9f,
};

// "ä¸‰ä½“" style text: a UTF-8 lead byte followed by continuation bytes, read as Latin-1.
const MOJIBAKE = /[\u00c2-\u00f4][\u0080-\u00bf\u0152\u0153\u0160\u0161\u0178\u017d\u017e\u0192\u02c6\u02dc\u2013-\u2122]/;

function repairMojibake(text: string): string {
  if (!MOJIBAKE.test(text)) return text;
  const bytes: number[] = [];
  for (const char of text) {
    const code = char.codePointAt(0)!;
    const byte = code <= 0xff ? code : CP1252_BYTES[char];
    if (byte === undefined) return text;
    bytes.push(byte);
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes));
  } catch {
    return text;
  }
}

// Clean text from the book APIs: HTML entities, mis-decoded UTF-8, stray
// replacement and control characters.
export function cleanText(text: string): string {
  const decoded = text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (entity, name) => HTML_ENTITIES[name.toLowerCase()] ?? entity);
  return repairMojibake(decoded)
    .replace(/[\u0000-\u001f\u007f-\u009f\ufffd]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CJK_TEXT = /[\u3400-\u9fff\uf900-\ufaff]/;

// Chinese lists keep only titles written in Chinese characters; romanized
// catalog entries ("Hong lou meng") and text that could not be repaired are dropped.
function fitsLanguage(book: Book): boolean {
  if (MOJIBAKE.test(book.title)) return false;
  return book.language !== "zh" || CJK_TEXT.test(book.title);
}

function cleanBook(book: Book | null): Book | null {
  if (!book) return null;
  const title = cleanText(book.title);
  if (!title) return null;
  const cleaned: Book = {
    ...book,
    title,
    authors: book.authors.map(cleanText).filter(Boolean),
    ...(book.publisher ? { publisher: cleanText(book.publisher) } : {}),
    ...(book.description ? { description: cleanText(book.description) } : {}),
  };
  if (!cleaned.authors.length) cleaned.authors = ["Unknown author"];
  return fitsLanguage(cleaned) ? cleaned : null;
}

const DESCRIPTION_MAX_LENGTH = 420;

// Descriptions are shown as a short blurb; keep the cached shelves small.
function shortDescription(text: string): string {
  const plain = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (plain.length <= DESCRIPTION_MAX_LENGTH) return plain;
  return plain.slice(0, DESCRIPTION_MAX_LENGTH).replace(/\s+\S*$/, "") + "…";
}

function googleIsbn(ids?: { type?: string; identifier?: string }[]): string | undefined {
  return (
    ids?.find((id) => id.type === "ISBN_13")?.identifier ??
    ids?.find((id) => id.type === "ISBN_10")?.identifier
  );
}

function pickIsbn(isbns?: string[]): string | undefined {
  return isbns?.find((isbn) => isbn.length === 13) ?? isbns?.[0];
}

function cleanTitle(title: string): string {
  // Remove common suffixes that clutter titles
  const suffixesToRemove = [
    /: A Novel$/i,
    /: A Memoir$/i,
    /: A Biography$/i,
    /: A History$/i,
    /: A Thriller$/i,
    /: A Mystery$/i,
    /: A Love Story$/i,
    /^A Novel: /i,
    /^A Memoir: /i,
    / - A Novel$/i,
    / - A Memoir$/i,
  ];

  let cleaned = title.trim();
  for (const suffix of suffixesToRemove) {
    cleaned = cleaned.replace(suffix, "");
  }

  // Remove text in parentheses at the end if it's just a subtitle
  cleaned = cleaned.replace(/\s*\([^)]*edition[^)]*\)$/i, "").trim();

  // Remove multiple spaces
  cleaned = cleaned.replace(/\s+/g, " ");

  return cleaned;
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
    title: cleanTitle(info.title),
    authors: info.authors?.length ? info.authors : ["Unknown author"],
    cover: toHttps(info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail),
    language,
    publishedDate: info.publishedDate,
    sourceUrl: info.infoLink,
    ...(info.publisher ? { publisher: info.publisher } : {}),
    ...(googleIsbn(info.industryIdentifiers) ? { isbn: googleIsbn(info.industryIdentifiers) } : {}),
    ...(info.pageCount ? { pageCount: info.pageCount } : {}),
    ...(info.description ? { description: shortDescription(info.description) } : {}),
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

  const data = await fetchJson<GoogleBooksResponse>(url, {
    Referer: "https://bookshire.net/",
  });

  return (data?.items ?? [])
    .map((item) => cleanBook(normalizeGoogleBook(item, params.language)))
    .filter((item): item is Book => item !== null);
}

async function fetchOpenLibraryBooks(params: {
  language: BookLanguage;
  subject?: string;
  limit?: number;
  sort?: "editions" | "new";
}): Promise<Book[]> {
  const url = buildOpenLibrarySearchUrl(params);
  const data = await fetchJson<OpenLibrarySearchResponse>(url);

  return (data?.docs ?? [])
    .map((item) => cleanBook(normalizeOpenLibraryBook(item, params.language)))
    .filter((item): item is Book => item !== null);
}

function parsePublishedDate(value?: string): Date | null {
  if (!value) {
    return null;
  }

  // Handle YYYY-MM-DD format
  const isoMatch = value.match(/^(\d{4})-(\d{2})?-(\d{2})?$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const m = month ? parseInt(month) - 1 : 0;
    const d = day ? parseInt(day) : 1;
    return new Date(parseInt(year), m, d);
  }

  // Handle YYYY format (common from OpenLibrary)
  const yearMatch = value.match(/^(\d{4})$/);
  if (yearMatch) {
    return new Date(parseInt(yearMatch[1]), 0, 1);
  }

  // Handle YYYY-MM format
  const yearMonthMatch = value.match(/^(\d{4})-(\d{2})$/);
  if (yearMonthMatch) {
    const [, year, month] = yearMonthMatch;
    return new Date(parseInt(year), parseInt(month) - 1, 1);
  }

  // Fallback to native Date parsing
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function takeTop(books: Book[], size = LIST_SIZE) {
  return books.slice(0, size);
}

function bookKey(book: Book) {
  const title = book.title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
  const author = (book.authors[0] ?? "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
  return `${title}|${author}`;
}

// Google Books often returns several editions of the same title.
function dedupeBooks(books: Book[]) {
  const seen = new Set<string>();
  return books.filter((book) => {
    const key = bookKey(book);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function fetchNewPublishBooks(language: BookLanguage, query: string) {
  const books = await fetchGoogleBooks({
    query,
    language,
    orderBy: "newest",
    maxResults: 20,
  });
  return takeTop(dedupeBooks(books));
}

async function fetchPopularPool(
  language: BookLanguage,
  query: string,
  orderBy?: "newest"
) {
  const googlePool = await fetchGoogleBooks({
    query,
    language,
    maxResults: 40,
    orderBy,
  });

  if (googlePool.length > 0) {
    return dedupeBooks(googlePool);
  }

  // Fallback to Open Library if Google Books is exhausted/rate limited
  return dedupeBooks(
    await fetchOpenLibraryBooks({
      language,
      subject: "fiction",
      limit: 40,
      sort: "new",
    })
  );
}

/**
 * Builds a shelf from candidate books, skipping anything already shown on
 * another shelf. Prefers books inside the publish window and tops up with the
 * remaining candidates so a shelf is never empty while the pool has books.
 */
function buildShelf(
  candidates: Book[],
  used: Set<string>,
  maxAgeDays: number
) {
  const now = Date.now();
  const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
  const available = candidates.filter((book) => !used.has(bookKey(book)));
  const inWindow = available.filter((book) => {
    const publishedDate = parsePublishedDate(book.publishedDate);
    return publishedDate !== null && now - publishedDate.getTime() <= maxAge;
  });
  const rest = available.filter((book) => !inWindow.includes(book));
  const shelf = takeTop([...inWindow, ...rest]);

  for (const book of shelf) {
    used.add(bookKey(book));
  }

  return shelf;
}

/**
 * Week, month and year shelves for one language. Two Google queries are
 * shared across all three shelves, and no book appears on more than one.
 */
async function fetchPopularShelves(language: BookLanguage, query: string) {
  const [newestPool, relevancePool] = await Promise.all([
    fetchPopularPool(language, query, "newest"),
    fetchPopularPool(language, query),
  ]);
  const used = new Set<string>();

  return {
    week: buildShelf(newestPool, used, 7),
    month: buildShelf(newestPool, used, 30),
    year: buildShelf(relevancePool, used, 365),
  };
}

async function fetchPopularYear(language: BookLanguage, query: string) {
  const pool = await fetchPopularPool(language, query);
  return buildShelf(pool, new Set(), 365);
}

export async function fetchBooks(): Promise<BooksData> {
  const [
    zhNewPublish,
    zhPopular,
    enNewPublish,
    enPopular,
    frBestSellerYear,
    esBestSellerYear,
    deBestSellerYear,
    ruBestSellerYear,
  ] = await Promise.all([
    fetchNewPublishBooks("zh", "小说"),
    fetchPopularShelves("zh", "畅销 小说"),
    fetchNewPublishBooks("en", "subject:fiction"),
    fetchPopularShelves("en", "bestseller fiction"),
    fetchPopularYear("fr", "bestseller fiction"),
    fetchPopularYear("es", "bestseller fiction"),
    fetchPopularYear("de", "bestseller fiction"),
    fetchPopularYear("ru", "bestseller fiction"),
  ]);

  return {
    zhNewPublish,
    zhBestSellerWeek: zhPopular.week,
    zhBestSellerMonth: zhPopular.month,
    zhBestSellerYear: zhPopular.year,
    enNewPublish,
    enBestSellerWeek: enPopular.week,
    enBestSellerMonth: enPopular.month,
    enBestSellerYear: enPopular.year,
    frBestSellerYear,
    esBestSellerYear,
    deBestSellerYear,
    ruBestSellerYear,
    updatedAt: new Date().toISOString(),
  };
}

export function countBooks(data: BooksData) {
  return Object.values(data).reduce(
    (total, value) => total + (Array.isArray(value) ? value.length : 0),
    0
  );
}
