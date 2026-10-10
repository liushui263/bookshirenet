import Constants from "expo-constants";
import { Platform } from "react-native";

function getApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  if (configured) return configured.replace(/\/$/, "");

  if (Platform.OS === "android") return "http://10.0.2.2:8000";

  const expoConstants = Constants as unknown as {
    expoConfig?: { hostUri?: string };
    manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
    manifest?: { debuggerHost?: string };
  };

  const hostUri =
    expoConstants.expoConfig?.hostUri ||
    expoConstants.manifest2?.extra?.expoClient?.hostUri ||
    expoConstants.manifest?.debuggerHost;

  const host = hostUri?.split(":")[0];
  if (host) return `http://${host}:8000`;

  return "http://localhost:8000";
}

export const API_BASE_URL = getApiBaseUrl();

export class ApiError extends Error {
  status: number;
  statusText: string;
  detail: string;

  constructor(status: number, statusText: string, detail: string) {
    super(`API request failed: ${detail}`);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.detail = detail;
  }
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

async function readErrorDetail(res: Response): Promise<string> {
  let detail = `${res.status} ${res.statusText}`;

  try {
    const body = await res.json();
    detail = body.detail ? JSON.stringify(body.detail) : JSON.stringify(body);
  } catch {
    // Keep HTTP detail.
  }

  return detail;
}

export type Book = {
  id: string;
  title: string;
  subtitle?: string | null;
  normalized_title?: string | null;
  original_language?: string | null;
  canonical_cover_url?: string | null;
  canonical_description?: string | null;
  avg_rating?: number | null;
  rating_avg?: number | null;
  rating_count?: number | null;
  tags?: string[] | null;
  categories?: string[] | null;
};

// Backend currently uses older persisted values: "unread" and "read".
// Mobile UI normalizes them through lib/shelfStatus.ts as "want_to_read" and "finished".
export type ReadingStatus = "unread" | "want_to_read" | "reading" | "read" | "finished" | "abandoned";

export type Review = {
  id: string;
  user_id: string;
  book_id: string;
  edition_id?: string | null;
  rating?: number | null;
  content?: string | null;
  visibility: string;
  created_at: string;
  updated_at: string;
};

export type UserBook = {
  id: string;
  user_id: string;
  edition_id: string;
  status: ReadingStatus;
  condition?: number | null;
  visibility: string;
  personal_tags?: string[] | null;
  personal_notes_summary?: string | null;
  created_at: string;
  updated_at: string;

  book_id: string;
  book_title: string;
  book_subtitle?: string | null;
  book_cover_url?: string | null;
  book_tags?: string[] | null;
  book_categories?: string[] | null;

  edition_title?: string | null;
  edition_language?: string | null;
  edition_cover_url?: string | null;
};

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    throw new ApiError(res.status, res.statusText, await readErrorDetail(res));
  }

  // Support both JSON responses and 204/empty responses.
  if (res.status === 204) {
    return null as T;
  }

  const text = await res.text();
  if (!text) {
    return null as T;
  }

  return JSON.parse(text) as T;
}

export function getBooks(): Promise<Book[]> {
  return fetchJson<Book[]>("/api/v1/books/");
}

export function getBook(bookId: string): Promise<Book> {
  return fetchJson<Book>(`/api/v1/books/${encodeURIComponent(bookId)}`);
}

export function searchBooks(query: string): Promise<Book[]> {
  return fetchJson<Book[]>(
    `/api/v1/books/search?q=${encodeURIComponent(query)}`,
  );
}

export function getUserBooks(userId: string): Promise<UserBook[]> {
  return fetchJson<UserBook[]>(
    `/api/v1/users/${encodeURIComponent(userId)}/books`,
  );
}

export function addBookToShelf(
  userId: string,
  bookId: string,
): Promise<UserBook | null> {
  return fetchJson<UserBook | null>(
    `/api/v1/users/${encodeURIComponent(userId)}/books/by-book/${encodeURIComponent(bookId)}`,
    { method: "POST" },
  );
}

export function updateUserBookStatus(
  userId: string,
  userBookId: string,
  status: ReadingStatus,
): Promise<UserBook | null> {
  return fetchJson<UserBook | null>(
    `/api/v1/users/${encodeURIComponent(userId)}/books/${encodeURIComponent(userBookId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
}

export function removeUserBook(
  userId: string,
  userBookId: string,
): Promise<UserBook | null> {
  return fetchJson<UserBook | null>(
    `/api/v1/users/${encodeURIComponent(userId)}/books/${encodeURIComponent(userBookId)}`,
    { method: "DELETE" },
  );
}

export function getBookReviews(bookId: string): Promise<Review[]> {
  return fetchJson<Review[]>(
    `/api/v1/books/${encodeURIComponent(bookId)}/reviews`,
  );
}

export function createBookReview(
  bookId: string,
  payload: {
    user_id: string;
    rating?: number | null;
    content?: string | null;
    visibility?: "private" | "friends" | "public";
  },
): Promise<Review> {
  return fetchJson<Review>(
    `/api/v1/books/${encodeURIComponent(bookId)}/reviews`,
    {
      method: "POST",
      body: JSON.stringify({
        visibility: "public",
        ...payload,
      }),
    },
  );
}

export function updateReview(
  reviewId: string,
  payload: {
    rating?: number | null;
    content?: string | null;
    visibility?: "private" | "friends" | "public";
  },
): Promise<Review> {
  return fetchJson<Review>(
    `/api/v1/reviews/${encodeURIComponent(reviewId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        visibility: "public",
        ...payload,
      }),
    },
  );
}

export async function deleteReview(reviewId: string): Promise<Review | null> {
  const res = await fetch(`${API_BASE_URL}/api/v1/reviews/${encodeURIComponent(reviewId)}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new ApiError(res.status, res.statusText, await readErrorDetail(res));
  }

  // Some backends return the deleted review; others return 204 No Content.
  if (res.status === 204) return null;

  const text = await res.text();
  if (!text) return null;

  return JSON.parse(text) as Review;
}
