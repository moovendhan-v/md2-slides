/** Pure string operations on a deck's front-matter block. */

export function writeMeta(src: string, key: string, value: string): string {
  const L = src.split("\n");
  if (L[0]?.trim() === "---") {
    let j = 1;
    while (j < L.length && L[j].trim() !== "---") j++;
    if (j < L.length) {
      for (let i = 1; i < j; i++) {
        if (L[i].startsWith(key + ":")) {
          L[i] = `${key}: ${value}`;
          return L.join("\n");
        }
      }
      L.splice(j, 0, `${key}: ${value}`);
      return L.join("\n");
    }
  }
  return `---\n${key}: ${value}\n---\n${src}`;
}

/** Body without the front-matter block. */
export const stripFrontMatter = (src: string) => src.replace(/^---\n[\s\S]*?\n---\n/, "");

/** Index of the closing front-matter `---`, or -1. */
export function frontMatterEnd(lines: string[]): number {
  if (lines[0]?.trim() !== "---") return -1;
  for (let i = 1; i < lines.length; i++) if (lines[i].trim() === "---") return i;
  return -1;
}

export function buildFrontMatter(entries: Record<string, string | number | boolean>): string {
  return ["---", ...Object.entries(entries).map(([k, v]) => `${k}: ${v}`), "---"].join("\n");
}
