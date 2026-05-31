import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

const STATUS_LABELS: Record<string, string> = {
  want_to_read: "Quero ler",
  reading: "Lendo",
  completed: "Concluído",
};

export default async function PerfilPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      name: true,
      username: true,
      createdAt: true,
      books: {
        where: {
          OR: [{ rating: { not: null } }, { notes: { not: null } }],
        },
        select: {
          id: true,
          title: true,
          author: true,
          genre: true,
          totalPages: true,
          status: true,
          rating: true,
          notes: true,
          yearStarted: true,
          coverUrl: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) notFound();

  const completed = user.books.filter((b) => b.status === "completed");
  const totalPages = completed.reduce((a, b) => a + b.totalPages, 0);

  const byYear: Record<number, number> = {};
  for (const b of user.books) {
    if (b.yearStarted) byYear[b.yearStarted] = (byYear[b.yearStarted] || 0) + 1;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
              {(user.name || user.username || "?")[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{user.name || user.username}</h1>
              <p className="text-sm text-gray-400 font-mono">@{user.username}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{completed.length}</p>
              <p className="text-xs text-gray-500">Concluídos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">{user.books.length}</p>
              <p className="text-xs text-gray-500">Com resenha</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{totalPages.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-gray-500">Páginas lidas</p>
            </div>
          </div>
        </div>

        {/* Livros por ano */}
        {Object.keys(byYear).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <h2 className="font-semibold text-gray-800 mb-3">Livros por ano</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(byYear).sort(([a], [b]) => Number(b) - Number(a)).map(([year, count]) => (
                <span key={year} className="bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-full font-medium">
                  {year} · {count} livro{count !== 1 ? "s" : ""}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Resenhas */}
        <h2 className="font-semibold text-gray-800 mb-3">
          Resenhas {user.books.length === 0 && <span className="text-gray-400 font-normal text-sm">— nenhuma ainda</span>}
        </h2>

        <div className="space-y-4">
          {user.books.map((book) => (
            <div key={book.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex gap-3">
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt={book.title} className="w-[50px] h-[75px] object-cover rounded-lg shadow-sm flex-shrink-0" />
                ) : (
                  <div className="w-[50px] h-[75px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-xl flex-shrink-0">📖</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-gray-900">{book.title}</h3>
                      <p className="text-sm text-gray-500">{book.author}</p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{STATUS_LABELS[book.status]}</span>
                  </div>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {book.genre && <span className="text-xs text-indigo-500">{book.genre}</span>}
                    {book.yearStarted && <span className="text-xs text-gray-400">📅 {book.yearStarted}</span>}
                  </div>
                  {book.rating && (
                    <p className="text-yellow-400 mt-1 text-sm">{"★".repeat(book.rating)}{"☆".repeat(5 - book.rating)}</p>
                  )}
                </div>
              </div>
              {book.notes && (
                <p className="text-sm text-gray-600 mt-3 border-t border-gray-50 pt-3 italic">"{book.notes}"</p>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          <Link href="/" className="hover:underline">📚 Minhas Leituras</Link>
        </p>
      </div>
    </main>
  );
}
