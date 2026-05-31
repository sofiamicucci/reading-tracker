"use client";

import { useState } from "react";
import MentionInput from "@/components/MentionInput";
import Link from "next/link";

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
  recommendedBy: string | null;
  coverUrl: string | null;
}

interface Props {
  book: Book;
  onUpdate: () => void;
}

function renderMentions(text: string) {
  return text.split(/(@[a-z0-9_]+)/gi).map((part, i) =>
    /^@[a-z0-9_]+$/i.test(part) ? (
      <Link key={i} href={`/perfil/${part.slice(1).toLowerCase()}`} className="text-indigo-500 hover:underline font-medium">
        {part}
      </Link>
    ) : part
  );
}

const STATUS_LABELS: Record<string, string> = {
  want_to_read: "Quero ler",
  reading: "Lendo",
  completed: "Concluído",
};

const STATUS_COLORS: Record<string, string> = {
  want_to_read: "bg-gray-100 text-gray-600",
  reading: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};

export default function BookCard({ book, onUpdate }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(String(book.currentPage));
  const [rating, setRating] = useState(book.rating || 0);
  const [notes, setNotes] = useState(book.notes || "");
  const [yearStarted, setYearStarted] = useState(
    book.yearStarted ? String(book.yearStarted) : ""
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const progress =
    book.totalPages > 0
      ? Math.round((book.currentPage / book.totalPages) * 100)
      : 0;

  async function patch(data: Record<string, unknown>) {
    setSaving(true);
    await fetch(`/api/books/${book.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    onUpdate();
  }

  async function handleDelete() {
    if (!confirm(`Remover "${book.title}"?`)) return;
    setDeleting(true);
    await fetch(`/api/books/${book.id}`, { method: "DELETE" });
    onUpdate();
  }

  async function handleStatus(status: string) {
    await patch({ status });
  }

  async function handleSaveDetails() {
    await patch({ currentPage: page, rating, notes, yearStarted: yearStarted || null });
    setExpanded(false);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        {/* Cover */}
        <div className="flex-shrink-0">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-[60px] h-[90px] object-cover rounded-lg shadow-sm"
            />
          ) : (
            <div className="w-[60px] h-[90px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-2xl shadow-sm">
              📖
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 truncate">{book.title}</h3>
              <p className="text-sm text-gray-500 truncate">{book.author}</p>
              <div className="flex gap-2 flex-wrap mt-0.5">
                {book.genre && (
                  <span className="text-xs text-indigo-500 font-medium">{book.genre}</span>
                )}
                {book.yearStarted && (
                  <span className="text-xs text-gray-400">📅 {book.yearStarted}</span>
                )}
                {book.recommendedBy && (
                  <span className="text-xs text-gray-400">👤 {renderMentions(book.recommendedBy!)}</span>
                )}
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${STATUS_COLORS[book.status]}`}>
              {STATUS_LABELS[book.status]}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{book.currentPage} / {book.totalPages} páginas</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-indigo-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {book.status !== "reading" && book.status !== "completed" && (
          <button
            onClick={() => handleStatus("reading")}
            className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-100 transition"
          >
            Começar leitura
          </button>
        )}
        {book.status === "reading" && (
          <button
            onClick={() => handleStatus("completed")}
            className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full hover:bg-green-100 transition"
          >
            Marcar concluído
          </button>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs bg-gray-50 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-100 transition ml-auto"
        >
          {expanded ? "Fechar" : "Detalhes"}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-red-400 hover:text-red-600 transition"
        >
          {deleting ? "..." : "Remover"}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 pt-3 space-y-3">
          {/* Update page */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">Página atual:</label>
            <input
              type="number"
              min="0"
              max={book.totalPages}
              value={page}
              onChange={(e) => setPage(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1 w-20 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Year started */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">Ano de início:</label>
            <input
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              value={yearStarted}
              onChange={(e) => setYearStarted(e.target.value)}
              placeholder={String(new Date().getFullYear())}
              className="border border-gray-200 rounded-lg px-2 py-1 w-24 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="text-sm text-gray-600 block mb-1">Avaliação:</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star === rating ? 0 : star)}
                  className={`text-xl transition ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm text-gray-600 block mb-1">Notas pessoais:</label>
            <MentionInput
              value={notes}
              onChange={setNotes}
              multiline
              placeholder="Seus pensamentos sobre o livro... (use @ para mencionar usuários)"
            />
          </div>

          <button
            onClick={handleSaveDetails}
            disabled={saving}
            className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar detalhes"}
          </button>
        </div>
      )}
    </div>
  );
}
