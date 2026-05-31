"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ConfiguracoesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [current, setCurrent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/users/me").then((r) => r.json()).then((data) => {
      if (data.username) { setCurrent(data.username); setUsername(data.username); }
    });
  }, [status]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setCurrent(data.username);
      setMessage({ type: "ok", text: "Username salvo!" });
    } else {
      setMessage({ type: "error", text: data.error });
    }
  }

  if (status === "loading") return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-indigo-600 text-sm hover:underline">← Voltar</Link>
          <h1 className="text-xl font-bold text-gray-900">Configurações</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-1">Perfil público</h2>
          <p className="text-sm text-gray-500 mb-4">
            Defina um username para ter um perfil público em{" "}
            <span className="font-mono text-indigo-600">/perfil/seuusername</span>
          </p>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">@</span>
                <input
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono text-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="seu_username"
                  minLength={3}
                  maxLength={30}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Letras minúsculas, números e _ (3-30 caracteres)</p>
            </div>

            {message && (
              <p className={`text-sm ${message.type === "ok" ? "text-green-600" : "text-red-500"}`}>
                {message.text}
              </p>
            )}

            <button
              type="submit"
              disabled={saving || username.length < 3}
              className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar username"}
            </button>
          </form>

          {current && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">Seu perfil público:</p>
              <Link
                href={`/perfil/${current}`}
                className="text-indigo-600 hover:underline text-sm font-mono"
              >
                /perfil/{current}
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
