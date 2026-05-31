import { NextResponse } from "next/server";

interface BookResult {
  id: string;
  title: string;
  author: string;
  year?: number;
  pages?: number;
  cover?: string;
}

function fromGoogle(items: unknown[]): BookResult[] {
  return (items ?? []).map((item: unknown) => {
    const i = item as { id: string; volumeInfo: { title: string; authors?: string[]; publishedDate?: string; pageCount?: number; imageLinks?: { thumbnail?: string } } };
    const v = i.volumeInfo;
    return {
      id: `gb-${i.id}`,
      title: v.title ?? "",
      author: v.authors?.[0] ?? "",
      year: v.publishedDate ? Number(v.publishedDate.slice(0, 4)) : undefined,
      pages: v.pageCount || undefined,
      cover: v.imageLinks?.thumbnail?.replace("http://", "https://"),
    };
  }).filter((b) => b.title);
}

function fromOpenLibrary(docs: unknown[]): BookResult[] {
  return (docs ?? []).map((doc: unknown) => {
    const d = doc as { key: string; title: string; author_name?: string[]; first_publish_year?: number; number_of_pages_median?: number; cover_i?: number };
    return {
      id: `ol-${d.key}`,
      title: d.title ?? "",
      author: d.author_name?.[0] ?? "",
      year: d.first_publish_year,
      pages: d.number_of_pages_median || undefined,
      cover: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-S.jpg` : undefined,
    };
  }).filter((b) => b.title);
}

function merge(google: BookResult[], ol: BookResult[]): BookResult[] {
  const seen = new Set<string>();
  const merged: BookResult[] = [];
  for (const book of [...google, ...ol]) {
    const key = `${book.title.toLowerCase().trim()}|${book.author.toLowerCase().trim()}`;
    if (!seen.has(key)) { seen.add(key); merged.push(book); }
  }
  return merged.slice(0, 8);
}

async function fetchWithTimeout(url: string, ms: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { signal: ctrl.signal }); }
  finally { clearTimeout(t); }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (!q) return NextResponse.json([]);

  const encoded = encodeURIComponent(q);
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY ?? "";

  const [googleRes, olRes] = await Promise.allSettled([
    fetchWithTimeout(
      `https://www.googleapis.com/books/v1/volumes?q=${encoded}&maxResults=5&langRestrict=pt${apiKey ? `&key=${apiKey}` : ""}`,
      3000
    ).then((r) => r.json()),
    fetchWithTimeout(
      `https://openlibrary.org/search.json?q=${encoded}&limit=5&lang=por&fields=key,title,author_name,first_publish_year,number_of_pages_median,cover_i`,
      3000
    ).then((r) => r.json()),
  ]);

  const googleBooks = googleRes.status === "fulfilled" ? fromGoogle(googleRes.value?.items ?? []) : [];
  const olBooks = olRes.status === "fulfilled" ? fromOpenLibrary(olRes.value?.docs ?? []) : [];

  return NextResponse.json(merge(googleBooks, olBooks));
}
