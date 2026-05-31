"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  onClose: () => void;
  onAdded: () => void;
  initialStatus?: string;
}

// Resultado normalizado (fonte única independente da API)
interface BookResult {
  id: string;
  title: string;
  author: string;
  year?: number;
  pages?: number;
  cover?: string;
  source: "google" | "openlibrary";
}

interface FormData {
  title: string;
  author: string;
  genre: string;
  totalPages: string;
  yearStarted: string;
  status: string;
  recommendedBy: string;
}

const GENRES = [
  "Ficção", "Não-ficção", "Fantasia", "Ciência", "História",
  "Biografia", "Autoajuda", "Romance", "Terror", "Outro",
];

// Normaliza resultados do Google Books
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
      source: "google" as const,
    };
  }).filter((b) => b.title);
}

// Normaliza resultados da Open Library
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
      source: "openlibrary" as const,
    };
  }).filter((b) => b.title);
}

// Combina resultados priorizando Google Books e remove duplicatas
function mergeResults(google: BookResult[], ol: BookResult[]): BookResult[] {
  const seen = new Set<string>();
  const merged: BookResult[] = [];

  for (const book of [...google, ...ol]) {
    const key = `${book.title.toLowerCase().trim()}|${book.author.toLowerCase().trim()}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(book);
    }
  }

  return merged.slice(0, 8);
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const STATUS_OPTIONS = [
  { value: "want_to_read", label: "Quero ler" },
  { value: "reading", label: "Lendo" },
  { value: "completed", label: "Concluído" },
];

export default function AddBookModal({ onClose, onAdded, initialStatus = "want_to_read" }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<BookResult | null>(null);
  const [manual, setManual] = useState(false);
  const blankForm = (): FormData => ({
    title: "", author: "", genre: "", totalPages: "",
    yearStarted: String(new Date().getFullYear()),
    status: initialStatus,
    recommendedBy: "",
  });
  const [form, setForm] = useState<FormData>(blankForm);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (manual || selected) return;
    if (!query.trim()) { setResults([]); return; }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const q = encodeURIComponent(query);

        const [googleRes, olRes] = await Promise.allSettled([
          fetchWithTimeout(
            `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=5&langRestrict=pt`,
            3000
          ).then((r) => r.json()),
          fetchWithTimeout(
            `https://openlibrary.org/search.json?q=${q}&limit=5&lang=por&fields=key,title,author_name,first_publish_year,number_of_pages_median,cover_i`,
            3000
          ).then((r) => r.json()),
        ]);

        const googleBooks = googleRes.status === "fulfilled"
          ? fromGoogle(googleRes.value?.items ?? [])
          : [];
        const olBooks = olRes.status === "fulfilled"
          ? fromOpenLibrary(olRes.value?.docs ?? [])
          : [];

        setResults(mergeResults(googleBooks, olBooks));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [query, manual, selected]);

  function handleSelect(book: BookResult) {
    setSelected(book);
    setForm({
      title: book.title,
      author: book.author,
      genre: "",
      totalPages: book.pages ? String(book.pages) : "",
      yearStarted: String(new Date().getFullYear()),
      status: initialStatus,
      recommendedBy: "",
    });
    setResults([]);
  }

  function handleManual() {
    setManual(true);
    setSelected(null);
    setForm({ title: query, author: "", genre: "", totalPages: "", yearStarted: String(new Date().getFullYear()), status: initialStatus, recommendedBy: "" });
    setResults([]);
  }

  function handleBack() {
    setSelected(null);
    setManual(false);
    setForm(blankForm());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.author || !form.totalPages) return;
    setLoading(true);
    await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    onAdded();
    onClose();
  }

  const showForm = selected || manual;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {showForm ? "Confirmar livro" : "Adicionar livro"}
          </h2>
          {showForm && (
            <button onClick={handleBack} className="text-sm text-indigo-600 hover:underline">
              ← Voltar
            </button>
          )}
        </div>

        {!showForm ? (
          <>
            {/* Search input */}
            <div className="relative mb-3">
              <input
                autoFocus
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Buscar por título ou autor..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {searching && (
                <span className="absolute right-3 top-2.5 text-gray-400 text-sm">⏳</span>
              )}
            </div>

            {/* Results */}
            {results.length > 0 && (
              <ul className="space-y-2 max-h-72 overflow-y-auto mb-3">
                {results.map((book) => (
                  <li key={book.id}>
                    <button
                      onClick={() => handleSelect(book)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-indigo-50 transition text-left"
                    >
                      {book.cover ? (
                        <img
                          src={book.cover}
                          alt={book.title}
                          className="w-10 h-14 object-cover rounded flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-14 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center text-gray-400 text-xs">
                          📖
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">{book.title}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {book.author || "Autor desconhecido"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {book.year ?? ""}
                          {book.pages ? ` · ${book.pages} págs.` : ""}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* No results / manual fallback */}
            {query.trim().length > 0 && !searching && results.length === 0 && (
              <p className="text-sm text-gray-500 mb-3">Nenhum resultado encontrado.</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 hover:bg-gray-50 transition text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleManual}
                className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2 hover:bg-gray-200 transition text-sm"
              >
                Preencher manualmente
              </button>
            </div>
          </>
        ) : (
          /* Confirmation / manual form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {selected?.cover && (
              <div className="flex justify-center">
                <img
                  src={selected.cover.replace("-S.jpg", "-M.jpg")}
                  alt={form.title}
                  className="h-32 rounded shadow"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Autor *</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gênero</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
              >
                <option value="">Selecione...</option>
                {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Indicado por</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.recommendedBy}
                onChange={(e) => setForm({ ...form, recommendedBy: e.target.value })}
                placeholder="Nome de quem indicou (opcional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano que comecei a ler</label>
              <input
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.yearStarted}
                onChange={(e) => setForm({ ...form, yearStarted: e.target.value })}
                placeholder={String(new Date().getFullYear())}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total de páginas *
                {selected && !selected.pages && (
                  <span className="ml-2 text-xs text-amber-500">não encontrado — preencha manualmente</span>
                )}
              </label>
              <input
                type="number"
                min="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={form.totalPages}
                onChange={(e) => setForm({ ...form, totalPages: e.target.value })}
                placeholder="Ex: 350"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !form.title || !form.author || !form.totalPages}
                className="flex-1 bg-indigo-600 text-white rounded-lg py-2 hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {loading ? "Salvando..." : "Adicionar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
