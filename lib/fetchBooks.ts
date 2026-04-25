export async function fetchBooks() {
  // 英文
  const enLatest = await fetch(
    "https://www.googleapis.com/books/v1/volumes?q=subject:fiction&orderBy=newest&maxResults=10"
  ).then(r => r.json());

  const enTrending = await fetch(
    "https://www.googleapis.com/books/v1/volumes?q=bestseller&maxResults=10"
  ).then(r => r.json());

  // 中文（用 Open Library + 简单关键词模拟）
  const cnLatest = await fetch(
    "https://openlibrary.org/search.json?q=小说&limit=10"
  ).then(r => r.json());

  return {
    enLatest: enLatest.items || [],
    enTrending: enTrending.items || [],
    cnLatest: cnLatest.docs || []
  };
}