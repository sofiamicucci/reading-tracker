"use client";

import { useState } from "react";

interface Props {
  onClose: () => void;
  onAdded: () => void;
}

export default function AddBookModal({ onClose, onAdded }: Props) {
  const [form, setForm] = useState({
    title: "",
    author: "",
    genre: "",
    totalPages: "",
  });
  const [loading, setLoading] = useState(false);

  const genres = [
    "Ficção",
    "Não-ficção",
    "Fantasia",
    "Ciência",
    "História",
    "Biografia",
    "Autoajuda",
    "Romance",
    "Terror",
    "Outro",
  ];

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Adicionar livro</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: O Senhor dos Anéis"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Autor *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              placeholder="Ex: J.R.R. Tolkien"
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
              {genres.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total de páginas *</label>
            <input
              type="number"
              min="1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.totalPages}
              onChange={(e) => setForm({ ...form, totalPages: e.target.value })}
              placeholder="Ex: 350"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white rounded-lg py-2 hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Adicionar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
