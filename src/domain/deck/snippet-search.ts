export interface SearchableSnippet {
  label: string;
  cat: string;
  md: string;
}

/**
 * Indices of snippets matching every word of `query` (label, category or
 * source), best first: label prefix, label word, label/category, then source.
 */
export function searchSnippets(snippets: readonly SearchableSnippet[], query: string): number[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return snippets.map((_, i) => i);
  const scored: [number, number][] = [];
  snippets.forEach((s, i) => {
    const label = s.label.toLowerCase();
    const head = `${label} ${s.cat.toLowerCase()}`;
    const all = `${head} ${s.md.toLowerCase()}`;
    if (!words.every((w) => all.includes(w))) return;
    const w = words[0];
    const score = label.startsWith(w) ? 0 : label.split(/[\s·/+-]+/).some((x) => x.startsWith(w)) ? 1 : words.every((x) => head.includes(x)) ? 2 : 3;
    scored.push([i, score]);
  });
  return scored.sort((a, b) => a[1] - b[1] || a[0] - b[0]).map(([i]) => i);
}
