"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erro ao criar conta.");
      setLoading(false);
      return;
    }

    await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">📚 Minhas Leituras</h1>
        <p className="text-sm text-gray-500 mb-6">Crie sua conta</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
            <input
              type="password"
              required
              minLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-lg py-2 font-medium hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          Já tem conta?{" "}
          <Link href="/login" className="text-indigo-600 hover:underline font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
