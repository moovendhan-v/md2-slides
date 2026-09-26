/** One entry of the Phosphor icon catalog (the icon font used by slides and the UI). */
export interface IconInfo {
  name: string;
  categories: readonly string[];
  tags: readonly string[];
}

/**
 * Rank icons for a query: exact name, then name prefix, name word, name
 * substring, then tag matches. An empty query keeps catalog order.
 */
export function searchIcons(icons: readonly IconInfo[], query: string, category?: string): IconInfo[] {
  const q = query.trim().toLowerCase().replace(/\s+/g, "-");
  const pool = category ? icons.filter((i) => i.categories.includes(category)) : icons;
  if (!q) return [...pool];
  const scored: { icon: IconInfo; score: number }[] = [];
  for (const icon of pool) {
    const n = icon.name;
    const score =
      n === q ? 0 : n.startsWith(q) ? 1 : n.split("-").some((w) => w.startsWith(q)) ? 2 : n.includes(q) ? 3 : icon.tags.some((t) => t.startsWith(q)) ? 4 : icon.tags.some((t) => t.includes(q)) ? 5 : -1;
    if (score >= 0) scored.push({ icon, score });
  }
  return scored.sort((a, b) => a.score - b.score || a.icon.name.length - b.icon.name.length).map((s) => s.icon);
}
