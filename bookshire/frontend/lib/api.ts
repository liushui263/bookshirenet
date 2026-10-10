function getApiBaseUrl() {
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

    try {
      const body = await res.json();
      detail = body.detail ? JSON.stringify(body.detail) : JSON.stringify(body);
    } catch {
      // Keep default HTTP detail.
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

export async function getUserBooks(userId: string): Promise<UserBook[]> {
  return fetchJson<UserBook[]>(
    `${getApiBaseUrl()}/api/v1/users/${encodeURIComponent(userId)}/books`
  );
}

export async function updateUserBookStatus(
  userId: string,
  userBookId: string,
  status: ReadingStatus
): Promise<UserBook> {
  return fetchJson<UserBook>(
    `${getApiBaseUrl()}/api/v1/users/${encodeURIComponent(
      userId
    )}/books/${encodeURIComponent(userBookId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }
  );
}

export async function removeUserBook(
  userId: string,
  userBookId: string
): Promise<UserBook> {
  return fetchJson<UserBook>(
    `${getApiBaseUrl()}/api/v1/users/${encodeURIComponent(
      userId
    )}/books/${encodeURIComponent(userBookId)}`,
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
export async function addBookToShelf(
  userId: string,
  bookId: string
): Promise<UserBook> {
  return fetchJson<UserBook>(
    `${getApiBaseUrl()}/api/v1/users/${encodeURIComponent(
      userId
    )}/books/by-book/${encodeURIComponent(bookId)}`,
    {
      method: "POST",
    }
  );
}
