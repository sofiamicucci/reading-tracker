export function extractMentions(...texts: (string | null | undefined)[]): string[] {
  const found = new Set<string>();
  for (const text of texts) {
    if (!text) continue;
    const matches = text.matchAll(/@([a-z0-9_]+)/gi);
    for (const m of matches) found.add(m[1].toLowerCase());
  }
  return [...found];
}
