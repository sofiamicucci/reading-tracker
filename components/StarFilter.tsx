"use client";

import { useState } from "react";

interface Props {
  value: number | null;
  onChange: (value: number | null) => void;
}

export default function StarFilter({ value, onChange }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-1 mb-5">
      <span className="text-xs text-gray-400 mr-1">Filtrar por nota:</span>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(value === star ? null : star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          className="text-2xl leading-none transition-colors"
          style={{
            color: (hovered !== null ? star <= hovered : star <= (value ?? 0))
              ? "#facc15"
              : "#d1d5db",
          }}
        >
          ★
        </button>
      ))}
      {value !== null && (
        <button
          onClick={() => onChange(null)}
          className="ml-1 text-gray-400 hover:text-gray-600 text-sm leading-none transition-colors"
          title="Limpar filtro"
        >
          ✕
        </button>
      )}
    </div>
  );
}
