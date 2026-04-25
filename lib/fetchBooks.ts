export interface GoogleBook {
  id?: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    imageLinks?: {
      thumbnail?: string;
    };
  };
}

export interface OpenLibraryBook {
  key?: string;
  title?: string;
  author_name?: string[];
}

export interface BooksData {
  enLatest: GoogleBook[];
  enTrending: GoogleBook[];
  cnLatest: OpenLibraryBook[];
}

interface GoogleBooksResponse {
  items?: GoogleBook[];
}

interface OpenLibraryResponse {
  docs?: OpenLibraryBook[];
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

export async function fetchBooks(): Promise<BooksData> {
  // 英文
  const [enLatest, enTrending, cnLatest] = await Promise.all([
    fetchJson<GoogleBooksResponse>(
      "https://www.googleapis.com/books/v1/volumes?q=subject:fiction&orderBy=newest&maxResults=10"
    ),
    fetchJson<GoogleBooksResponse>(
      "https://www.googleapis.com/books/v1/volumes?q=bestseller&maxResults=10"
    ),
    // 中文（用 Open Library + 简单关键词模拟）
    fetchJson<OpenLibraryResponse>(
      `https://openlibrary.org/search.json?q=${encodeURIComponent("小说")}&limit=10`
    ),
  ]);

  return {
    enLatest: enLatest?.items || [],
    enTrending: enTrending?.items || [],
    cnLatest: cnLatest?.docs || [],
  };
}
