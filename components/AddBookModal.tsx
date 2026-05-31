"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  onClose: () => void;
  onAdded: () => void;
}

interface OLResult {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  number_of_pages_median?: number;
  cover_i?: number;
}

interface FormData {
  title: string;
  author: string;
  genre: string;
  totalPages: string;
  yearStarted: string;
}

const GENRES = [
  "Ficção", "Não-ficção", "Fantasia", "Ciência", "História",
  "Biografia", "Autoajuda", "Romance", "Terror", "Outro",
];

export default function AddBookModal({ onClose, onAdded }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OLResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<OLResult | null>(null);
  const [manual, setManual] = useState(false);
  const [form, setForm] = useState<FormData>({ title: "", author: "", genre: "", totalPages: "", yearStarted: String(new Date().getFullYear()) });
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (manual || selected) return;
    if (!query.trim()) { setResults([]); return; }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&fields=key,title,author_name,first_publish_year,number_of_pages_median,cover_i`
        );
        const json = await res.json();
        setResults(json.docs || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [query, manual, selected]);

  function handleSelect(book: OLResult) {
    setSelected(book);
    setForm({
      title: book.title,
      author: book.author_name?.[0] ?? "",
      genre: "",
      totalPages: book.number_of_pages_median ? String(book.number_of_pages_median) : "",
      yearStarted: String(new Date().getFullYear()),
    });
    setResults([]);
  }

  function handleManual() {
    setManual(true);
    setSelected(null);
    setForm({ title: query, author: "", genre: "", totalPages: "", yearStarted: String(new Date().getFullYear()) });
    setResults([]);
  }

  function handleBack() {
    setSelected(null);
    setManual(false);
    setForm({ title: "", author: "", genre: "", totalPages: "", yearStarted: String(new Date().getFullYear()) });
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
                  <li key={book.key}>
                    <button
                      onClick={() => handleSelect(book)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-indigo-50 transition text-left"
                    >
                      {book.cover_i ? (
                        <img
                          src={`https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg`}
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
                          {book.author_name?.[0] ?? "Autor desconhecido"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {book.first_publish_year ?? ""}
                          {book.number_of_pages_median ? ` · ${book.number_of_pages_median} págs.` : ""}
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
            {selected?.cover_i && (
              <div className="flex justify-center">
                <img
                  src={`https://covers.openlibrary.org/b/id/${selected.cover_i}-M.jpg`}
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
                {selected && !selected.number_of_pages_median && (
                  <span className="ml-2 text-xs text-amber-500">não encontrado na busca — preencha manualmente</span>
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
