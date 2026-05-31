"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import AddBookModal from "@/components/AddBookModal";
import BookCard from "@/components/BookCard";
import Indicators from "@/components/Indicators";
import StarFilter from "@/components/StarFilter";

interface Book {
  id: number;
  title: string;
  author: string;
  genre: string | null;
  totalPages: number;
  currentPage: number;
  status: string;
  rating: number | null;
  notes: string | null;
  yearStarted: number | null;
}

const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "reading", label: "Lendo" },
  { key: "want_to_read", label: "Quero ler" },
  { key: "completed", label: "Concluídos" },
  { key: "indicators", label: "📊 Indicadores" },
];

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [filter, setFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const fetchBooks = useCallback(async () => {
    const res = await fetch("/api/books");
    if (res.ok) setBooks(await res.json());
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchBooks();
  }, [status, fetchBooks]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Carregando...</p>
      </main>
    );
  }

  const isIndicators = filter === "indicators";
  const isCompleted = filter === "completed";

  const filtered = (() => {
    let list = filter === "all" || isIndicators
      ? books
      : books.filter((b) => b.status === filter);

    if (isCompleted && ratingFilter !== null) {
      list = list.filter((b) => b.rating === ratingFilter);
    }

    return list;
  })();

  const reading = books.filter((b) => b.status === "reading");
  const completed = books.filter((b) => b.status === "completed");

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📚 Minhas Leituras</h1>
            <p className="text-sm text-gray-500 mt-1">
              {session?.user?.name || session?.user?.email} · {books.length} livro{books.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
            >
              + Adicionar
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="border border-gray-200 text-gray-500 px-3 py-2 rounded-xl text-sm hover:bg-gray-100 transition"
              title="Sair"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-blue-600">{reading.length}</p>
            <p className="text-xs text-gray-500 mt-1">Lendo agora</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-green-600">{completed.length}</p>
            <p className="text-xs text-gray-500 mt-1">Concluídos</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-indigo-600">
              {completed.reduce((acc, b) => acc + b.totalPages, 0).toLocaleString("pt-BR")}
            </p>
            <p className="text-xs text-gray-500 mt-1">Páginas lidas</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setRatingFilter(null); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                filter === f.key
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {f.label}
              {f.key !== "indicators" && (
                <span className="ml-1.5 text-xs opacity-70">
                  {f.key === "all"
                    ? books.length
                    : books.filter((b) => b.status === f.key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Rating sub-filter — só aparece na aba Concluídos */}
        {isCompleted && (
          <StarFilter value={ratingFilter as number | null} onChange={setRatingFilter} />
        )}

        {/* Content */}
        {isIndicators ? (
          <Indicators books={books} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📖</p>
            <p className="text-sm">Nenhum livro aqui ainda.</p>
            {filter === "all" && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-3 text-indigo-600 text-sm hover:underline"
              >
                Adicionar o primeiro
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((book) => (
              <BookCard key={book.id} book={book} onUpdate={fetchBooks} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AddBookModal
          onClose={() => setShowModal(false)}
          onAdded={fetchBooks}
        />
      )}
    </main>
  );
}
