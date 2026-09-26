/** A Markdown file that reads like a deck: front matter, slide breaks or deck blocks. */
export function looksLikeDeck(text: string): boolean {
  const lines = text.split("\n", 400).map((l) => l.trim());
  let inCode = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith("```")) inCode = !inCode;
    if (inCode) continue;
    if (l === "---" && (i === 0 || lines[i - 1] === "")) return true;
    if (/^:::\w/.test(l) || /^<!--\s*(layout|bg|transition|split)\s*:/.test(l)) return true;
  }
  return false;
}
