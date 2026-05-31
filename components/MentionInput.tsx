"use client";

import { useEffect, useRef, useState } from "react";

interface User { username: string; name: string | null; }

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}

export default function MentionInput({ value, onChange, placeholder, multiline, className }: Props) {
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) {
    const val = e.target.value;
    onChange(val);

    const cursor = e.target.selectionStart ?? val.length;
    const before = val.slice(0, cursor);
    const match = before.match(/@([a-z0-9_]*)$/i);
    if (match) {
      setMentionQuery(match[1]);
    } else {
      setMentionQuery(null);
      setSuggestions([]);
    }
  }

  useEffect(() => {
    if (mentionQuery === null) return;
    if (mentionQuery.length === 0) { setSuggestions([]); return; }
    fetch(`/api/users/search?q=${encodeURIComponent(mentionQuery)}`)
      .then((r) => r.json())
      .then(setSuggestions)
      .catch(() => setSuggestions([]));
  }, [mentionQuery]);

  function insertMention(username: string) {
    const el = ref.current;
    if (!el) return;
    const cursor = el.selectionStart ?? value.length;
    const before = value.slice(0, cursor);
    const after = value.slice(cursor);
    const replaced = before.replace(/@([a-z0-9_]*)$/i, `@${username} `);
    onChange(replaced + after);
    setSuggestions([]);
    setMentionQuery(null);
    setTimeout(() => { el.focus(); el.setSelectionRange(replaced.length, replaced.length); }, 0);
  }

  const shared = {
    ref,
    value,
    onChange: handleChange,
    placeholder,
    className: className ?? "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300",
  };

  return (
    <div className="relative">
      {multiline ? (
        <textarea {...shared} rows={3} className={(shared.className) + " resize-none"} />
      ) : (
        <input {...shared} />
      )}
      {suggestions.length > 0 && (
        <ul className="absolute z-20 left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg w-full max-h-40 overflow-y-auto">
          {suggestions.map((u) => (
            <li key={u.username}>
              <button
                type="button"
                onClick={() => insertMention(u.username)}
                className="w-full text-left px-4 py-2 hover:bg-indigo-50 transition text-sm"
              >
                <span className="font-medium text-indigo-600">@{u.username}</span>
                {u.name && <span className="text-gray-500 ml-2">{u.name}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
