export function getApiBaseUrl() {
  if (typeof window === "undefined") {
    return (
      process.env.INTERNAL_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://localhost:8000"
    );
  }

  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
}

export type Book = {
  id: string;
  title: string;
  subtitle?: string | null;
  normalized_title?: string | null;
  original_language?: string | null;

  cover_url?: string | null;
  canonical_cover_url?: string | null;

  description?: string | null;
  canonical_description?: string | null;

  avg_rating?: number | null;
  rating_avg?: number | null;
  rating_count?: number | null;

  tags?: string[] | null;
  categories?: string[] | null;

  publisher?: string | null;
  published_date?: string | null;
  isbn_10?: string | null;
  isbn_13?: string | null;
  page_count?: number | null;
};

export type CurrentUser = {
  id: string;
  email?: string | null;
  username?: string | null;
  display_name: string;
};

export type Review = {
  id: string;
  user_id: string;
  book_id: string;
  edition_id?: string | null;
  rating: number;
  content?: string | null;
  visibility: string;
  created_at: string;
  updated_at: string;
};

export type ReadingStatus =
  | "unread"
  | "reading"
  | "read"
  | "abandoned";

export type UserBook = {
  id: string;
  user_id: string;
  edition_id: string;
  status: ReadingStatus;
  condition?: number | null;
  location_text?: string | null;
  exchangeable: boolean;
  visibility: string;
  personal_tags: string[];
  personal_notes_summary?: string | null;
  acquired_at?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  created_at: string;
  updated_at: string;

  book_id: string;
  book_title: string;
  book_subtitle?: string | null;
  book_cover_url?: string | null;
  book_tags: string[];
  book_categories: string[];

  edition_title?: string | null;
  edition_language?: string | null;
  edition_cover_url?: string | null;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    let body: { detail?: unknown } | null = null;

    try {
      body = await res.json();
    } catch {
      // Keep default HTTP detail.
    }

    // A plain-text reason from the API is meant for people; show it as is.
    if (typeof body?.detail === "string") {
      throw new Error(body.detail);
    }
    if (body) {
      detail = body.detail ? JSON.stringify(body.detail) : JSON.stringify(body);
    }

    throw new Error(`API request failed: ${detail}`);
  }

  return res.json();
}

export async function getBooks(): Promise<Book[]> {
  return fetchJson<Book[]>(`${getApiBaseUrl()}/api/v1/books/`);
}

export async function getBook(id: string): Promise<Book> {
  return fetchJson<Book>(
    `${getApiBaseUrl()}/api/v1/books/${encodeURIComponent(id)}`
  );
}

export async function getBookReviews(bookId: string): Promise<Review[]> {
  return fetchJson<Review[]>(
    `${getApiBaseUrl()}/api/v1/books/${encodeURIComponent(bookId)}/reviews`
  );
}

export async function getMyBooks(token: string): Promise<UserBook[]> {
  return fetchJson<UserBook[]>(`${getApiBaseUrl()}/api/v1/me/books`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Browser-side calls for the signed-in user go through this app's own
// /api/backend proxy, which adds the token from the httpOnly session cookie.
const BROWSER_PROXY = "/api/backend";

export async function updateMyBookStatus(
  userBookId: string,
  status: ReadingStatus
): Promise<UserBook> {
  return fetchJson<UserBook>(
    `${BROWSER_PROXY}/me/books/${encodeURIComponent(userBookId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }
  );
}

export async function removeMyBook(userBookId: string): Promise<UserBook> {
  return fetchJson<UserBook>(
    `${BROWSER_PROXY}/me/books/${encodeURIComponent(userBookId)}`,
    {
      method: "DELETE",
    }
  );
}

export async function searchBooks(query: string): Promise<Book[]> {
  return fetchJson<Book[]>(
    `${getApiBaseUrl()}/api/v1/books/search?q=${encodeURIComponent(query)}`
  );
}
export async function addBookToMyShelf(bookId: string): Promise<UserBook> {
  return fetchJson<UserBook>(
    `${BROWSER_PROXY}/me/books/by-book/${encodeURIComponent(bookId)}`,
    {
      method: "POST",
    }
  );
}

export type UserBookPatch = Partial<
  Pick<
    UserBook,
    | "status"
    | "condition"
    | "location_text"
    | "exchangeable"
    | "visibility"
    | "personal_tags"
    | "personal_notes_summary"
    | "acquired_at"
    | "started_at"
    | "finished_at"
  >
>;

export type ShelfImportResult = {
  added: number;
  updated: number;
  failed: number;
  errors: { row: number; title?: string | null; error: string }[];
};

export async function listMyBooksFromBrowser(): Promise<UserBook[]> {
  return fetchJson<UserBook[]>(`${BROWSER_PROXY}/me/books`);
}

export async function updateMyBook(userBookId: string, patch: UserBookPatch): Promise<UserBook> {
  return fetchJson<UserBook>(`${BROWSER_PROXY}/me/books/${encodeURIComponent(userBookId)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function addMyBookByIsbn(isbn: string): Promise<UserBook> {
  return fetchJson<UserBook>(`${BROWSER_PROXY}/me/books/isbn`, {
    method: "POST",
    body: JSON.stringify({ isbn }),
  });
}

export async function importShelfFile(format: "csv" | "json", content: string): Promise<ShelfImportResult> {
  return fetchJson<ShelfImportResult>(`${BROWSER_PROXY}/me/books/import-file`, {
    method: "POST",
    body: JSON.stringify({ format, content }),
  });
}

export function shelfExportUrl(format: "csv" | "json") {
  return `${BROWSER_PROXY}/me/books/export?format=${format}`;
}
