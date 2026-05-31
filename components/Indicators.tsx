"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Book {
  yearStarted: number | null;
}

interface Props {
  books: Book[];
}

export default function Indicators({ books }: Props) {
  // Agrupar livros por ano
  const countByYear: Record<number, number> = {};
  for (const book of books) {
    if (book.yearStarted) {
      countByYear[book.yearStarted] = (countByYear[book.yearStarted] || 0) + 1;
    }
  }

  const data = Object.entries(countByYear)
    .map(([year, count]) => ({ ano: Number(year), livros: count }))
    .sort((a, b) => a.ano - b.ano);

  if (data.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">📊</p>
        <p className="text-sm">Nenhum dado ainda.</p>
        <p className="text-xs mt-1">Adicione o ano de início nos seus livros para ver os indicadores.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h2 className="font-bold text-gray-800 mb-1">Livros iniciados por ano</h2>
      <p className="text-xs text-gray-400 mb-5">Baseado no campo "ano de início" dos seus livros</p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="ano"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: 13 }}
            formatter={(value) => [`${value} livro${value !== 1 ? "s" : ""}`, "Iniciados"]}
            labelFormatter={(label) => `Ano: ${label}`}
          />
          <Bar dataKey="livros" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={60} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
