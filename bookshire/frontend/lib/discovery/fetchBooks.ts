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
  // Number of Google Books ratings, used to rank the popular lists.
  ratingsCount?: number;
}

export interface BooksData {
  zhNewPublish: Book[];
  // New releases in the other categories (fiction is zhNewPublish/enNewPublish).
  zhNewByCategory: Partial<Record<CategoryId, Book[]>>;
  enNewByCategory: Partial<Record<CategoryId, Book[]>>;
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
    categories?: string[];
    ratingsCount?: number;
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
  sort?: OpenLibrarySort;
  sinceYear?: number;
}) {
  const languageCode = getOpenLibraryLanguageCode(params.language);
  const query = [
    params.subject ? `subject:${params.subject}` : "",
    `language:${languageCode}`,
    params.sinceYear ? `first_publish_year:[${params.sinceYear} TO *]` : "",
  ]
    .filter(Boolean)
    .join(" ");

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
    ...(info.ratingsCount ? { ratingsCount: info.ratingsCount } : {}),
  };
}

// Categories for the new-release lists. Google files Chinese books under the
// same English categories ("Fiction", "History", …), but many Chinese volumes
// carry none, so Chinese searches add a keyword too.
export type CategoryId = "fiction" | "history" | "biography" | "science" | "business" | "psychology" | "children";

type Category = {
  id: CategoryId;
  // Google Books subject: query, and the Open Library subject for the fallback.
  subject: string;
  zhKeyword: string;
  // A volume with categories must have one matching this.
  match: RegExp;
};

export const CATEGORIES: Category[] = [
  { id: "fiction", subject: "fiction", zhKeyword: "小说", match: /fiction|novel|小说|literary collections/i },
  { id: "history", subject: "history", zhKeyword: "历史", match: /history|历史/i },
  { id: "biography", subject: "biography", zhKeyword: "传记", match: /biography|autobiography|memoir|传记/i },
  { id: "science", subject: "science", zhKeyword: "科普", match: /science|nature|mathematics|technology|medical|科学|科普/i },
  { id: "business", subject: "business", zhKeyword: "经济", match: /business|economics|经济|管理/i },
  { id: "psychology", subject: "psychology", zhKeyword: "心理学", match: /psychology|self-help|心理/i },
  { id: "children", subject: "juvenile", zhKeyword: "童书", match: /juvenile|children|儿童|童书/i },
];

const FICTION = CATEGORIES[0];

// Books about the book trade (publishing, bookselling, catalogues) match
// "畅销"/"bestseller" style queries in every category.
const ABOUT_PUBLISHING =
  /出版|书业|畅销书|营销|期刊|年鉴|publishing|publisher|bookselling|bestseller list|best-seller list|yearbook/i;

// Books about novels (criticism, writing guides, textbooks) are not novels.
const ABOUT_FICTION = /编辑|写作|研究|理论|评论|鉴赏|文学史|小说史|教程|教材|how to write|writing a novel/i;

function inCategory(item: GoogleBooksVolume, category: Category): boolean {
  const info = item.volumeInfo;
  if (!info?.title) return false;
  if (ABOUT_PUBLISHING.test(info.title)) return false;
  if (category.id === "fiction" && ABOUT_FICTION.test(info.title)) return false;
  const categories = info.categories ?? [];
  // Uncategorised volumes are common for Chinese books; the subject: query
  // already narrowed them, so only reject an explicit other category.
  return categories.length === 0 || categories.some((name) => category.match.test(name));
}

function categoryQueries(language: BookLanguage, category: Category) {
  const subject = `subject:${category.subject}`;
  return language === "zh" ? [subject, category.zhKeyword] : [subject];
}

async function fetchGoogleBooks(params: {
  query: string;
  language: BookLanguage;
  category: Category;
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
    .filter((item) => inCategory(item, params.category))
    .map((item) => cleanBook(normalizeGoogleBook(item, params.language)))
    .filter((item): item is Book => item !== null);
}

type OpenLibrarySort = "new" | "readinglog";

async function fetchOpenLibraryBooks(params: {
  language: BookLanguage;
  subject?: string;
  limit?: number;
  sort?: OpenLibrarySort;
  sinceYear?: number;
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

const DAY_MS = 24 * 60 * 60 * 1000;
// Pre-orders up to three months out still count as new.
const MAX_DAYS_AHEAD = 90;

function ageInDays(book: Book, now: number): number | null {
  const published = parsePublishedDate(book.publishedDate);
  return published ? (now - published.getTime()) / DAY_MS : null;
}

function publishedWithin(book: Book, maxDays: number, now: number) {
  const age = ageInDays(book, now);
  return age !== null && age >= -MAX_DAYS_AHEAD && age <= maxDays;
}

function newestFirst(a: Book, b: Book) {
  return (
    (parsePublishedDate(b.publishedDate)?.getTime() ?? 0) -
    (parsePublishedDate(a.publishedDate)?.getTime() ?? 0)
  );
}

// Google Books has no sales rank; the number of ratings is the best popularity
// signal it returns. Ties go to the newer book.
function mostRatedFirst(a: Book, b: Book) {
  return (b.ratingsCount ?? 0) - (a.ratingsCount ?? 0) || newestFirst(a, b);
}

function mergePools(...pools: Book[][]) {
  return dedupeBooks(pools.flat());
}

const NEW_WINDOW_DAYS = 365;
const POPULAR_MAX_AGE_DAYS = 3 * 365;

function sinceYear(days: number) {
  return new Date(Date.now() - days * DAY_MS).getFullYear();
}

// The new list and the popular lists ask Google the same questions; share the
// answers within one refresh to stay inside the daily quota.
let googleRequests = new Map<string, Promise<Book[]>>();

function fetchGoogleBooksOnce(params: Parameters<typeof fetchGoogleBooks>[0]) {
  const key = JSON.stringify({ ...params, category: params.category.id });
  let request = googleRequests.get(key);
  if (!request) {
    request = fetchGoogleBooks(params);
    googleRequests.set(key, request);
  }
  return request;
}

async function fetchCategoryPool(language: BookLanguage, category: Category, orderBy?: "newest") {
  const pools = await Promise.all(
    categoryQueries(language, category).map((query) =>
      fetchGoogleBooksOnce({ query, language, category, maxResults: 40, orderBy })
    )
  );
  return mergePools(...pools);
}

/**
 * The newest fiction published in the last year, newest first. Google's
 * "newest" ordering still returns old titles, so the date window is enforced here.
 */
/**
 * The newest books of one category published in the last year, newest first.
 * Google's "newest" ordering still returns old titles, so the date window is
 * enforced here.
 */
async function fetchNewPublishBooks(language: BookLanguage, category: Category) {
  const now = Date.now();
  let pool = (await fetchCategoryPool(language, category, "newest")).filter((book) =>
    publishedWithin(book, NEW_WINDOW_DAYS, now)
  );
  if (pool.length < LIST_SIZE) {
    const openLibrary = await fetchOpenLibraryBooks({
      language,
      subject: category.subject,
      limit: 40,
      sort: "new",
      sinceYear: sinceYear(NEW_WINDOW_DAYS),
    });
    pool = mergePools(pool, openLibrary.filter((book) => publishedWithin(book, NEW_WINDOW_DAYS, now)));
  }
  return takeTop(pool.sort(newestFirst));
}

async function fetchPopularPool(language: BookLanguage, orderBy?: "newest") {
  const googlePool = await fetchCategoryPool(language, FICTION, orderBy);
  if (googlePool.length > 0) {
    return googlePool;
  }

  // Fallback to Open Library if Google Books is exhausted/rate limited:
  // recent fiction ordered by how many readers have shelved it.
  return dedupeBooks(
    await fetchOpenLibraryBooks({
      language,
      subject: "fiction",
      limit: 40,
      sort: orderBy === "newest" ? "new" : "readinglog",
      sinceYear: sinceYear(POPULAR_MAX_AGE_DAYS),
    })
  );
}

/**
 * Builds a shelf from candidate books, skipping anything already shown on
 * another shelf. Books published inside the window come first, most rated
 * first; the shelf is topped up with other recent books, never with old ones.
 */
function buildShelf(candidates: Book[], used: Set<string>, maxAgeDays: number, topUpDays: number) {
  const now = Date.now();
  const available = candidates.filter((book) => !used.has(bookKey(book)));
  const inWindow = available
    .filter((book) => publishedWithin(book, maxAgeDays, now))
    .sort(mostRatedFirst);
  const topUp = available
    .filter((book) => !inWindow.includes(book) && publishedWithin(book, topUpDays, now))
    .sort(mostRatedFirst);
  const shelf = takeTop([...inWindow, ...topUp]);

  for (const book of shelf) {
    used.add(bookKey(book));
  }

  return shelf;
}

/**
 * Week, month and year shelves for one language, sharing two candidate pools
 * so no book appears on more than one shelf.
 */
async function fetchPopularShelves(language: BookLanguage) {
  const [newestPool, relevancePool] = await Promise.all([
    fetchPopularPool(language, "newest"),
    fetchPopularPool(language),
  ]);
  const pool = mergePools(newestPool, relevancePool);
  const used = new Set<string>();

  return {
    week: buildShelf(pool, used, 7, 90),
    month: buildShelf(pool, used, 30, 180),
    year: buildShelf(pool, used, 365, POPULAR_MAX_AGE_DAYS),
  };
}

async function fetchPopularYear(language: BookLanguage) {
  const pool = await fetchPopularPool(language);
  return buildShelf(pool, new Set(), 365, POPULAR_MAX_AGE_DAYS);
}

// New releases for every category but fiction, which has its own list.
async function fetchNewByCategory(language: BookLanguage) {
  const lists = await Promise.all(
    CATEGORIES.slice(1).map(async (category) => [category.id, await fetchNewPublishBooks(language, category)] as const)
  );
  return Object.fromEntries(lists) as Partial<Record<CategoryId, Book[]>>;
}

export async function fetchBooks(): Promise<BooksData> {
  googleRequests = new Map();
  const [
    zhNewPublish,
    zhNewByCategory,
    zhPopular,
    enNewPublish,
    enNewByCategory,
    enPopular,
    frBestSellerYear,
    esBestSellerYear,
    deBestSellerYear,
    ruBestSellerYear,
  ] = await Promise.all([
    fetchNewPublishBooks("zh", FICTION),
    fetchNewByCategory("zh"),
    fetchPopularShelves("zh"),
    fetchNewPublishBooks("en", FICTION),
    fetchNewByCategory("en"),
    fetchPopularShelves("en"),
    fetchPopularYear("fr"),
    fetchPopularYear("es"),
    fetchPopularYear("de"),
    fetchPopularYear("ru"),
  ]);

  return {
    zhNewPublish,
    zhNewByCategory,
    zhBestSellerWeek: zhPopular.week,
    zhBestSellerMonth: zhPopular.month,
    zhBestSellerYear: zhPopular.year,
    enNewPublish,
    enNewByCategory,
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
  const lists: unknown[] = Object.values(data).flatMap((value) =>
    Array.isArray(value) ? [value] : value && typeof value === "object" ? Object.values(value) : []
  );
  return lists.reduce<number>((total, list) => total + (Array.isArray(list) ? list.length : 0), 0);
}
