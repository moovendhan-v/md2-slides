import type { Block } from "@/engine/types";

/** Source rewrites for a single block, addressed by its start line. */

const FENCED = ["cards", "stats", "flow", "timeline", "terminal", "list", "chart", "gallery"];

export interface BlockRange {
  start: number;
  end: number;
  text: string;
}

export function blockRange(src: string, b: Block): BlockRange {
  const L = src.split("\n");
  let end = b.line;
  if (b.type === "code") {
    end++;
    while (end < L.length && !L[end].trim().startsWith("```")) end++;
  } else if (!b.bare && FENCED.includes(b.type)) {
    end++;
    while (end < L.length - 1 && L[end].trim() !== ":::") end++;
  } else if (b.bare) end = b.line + (b.rows?.length ?? 1) - 1;
  else if (b.type === "table") end = b.line + (b.tableRows?.length ?? 0) + 1;
  end = Math.min(end, L.length - 1);
  return { start: b.line, end, text: L.slice(b.line, end + 1).join("\n") };
}

export function removeBlock(src: string, b: Block): string {
  const { start, end } = blockRange(src, b);
  const L = src.split("\n");
  L.splice(start, end - start + 1);
  return L.join("\n");
}

export function duplicateBlock(src: string, b: Block): string {
  const r = blockRange(src, b);
  const L = src.split("\n");
  L.splice(r.end + 1, 0, "", ...r.text.split("\n"));
  return L.join("\n");
}

export function setImageArg(src: string, line: number, key: string, value: string): string {
  const L = src.split("\n");
  const m = L[line]?.match(/^(\s*!\[.*?\]\(.*?\))(\{(.*)\})?(.*)$/);
  if (!m) return src;
  const a: Record<string, string> = {};
  (m[3] || "")
    .split(/\s+/)
    .filter(Boolean)
    .forEach((t) => {
      const x = t.match(/^(\w+)=(.*)$/);
      if (x) a[x[1]] = x[2];
    });
  if (value === "" || value == null) delete a[key];
  else a[key] = value;
  const s = Object.entries(a).map(([x, y]) => `${x}=${y}`).join(" ");
  L[line] = m[1] + (s ? `{${s}}` : "") + m[4];
  return L.join("\n");
}

export function setImageSrc(src: string, line: number, url: string): string {
  const L = src.split("\n");
  L[line] = L[line].replace(/^(\s*!\[.*?\])\((.*?)\)/, (_, a) => `${a}(${url})`);
  return L.join("\n");
}

/** Change a block's variant (`style=`, callout kind, code chrome, image fit). */
export function setVariant(src: string, b: Block, v: string): string {
  if (b.type === "image") return setImageArg(src, b.line, "fit", v);
  const L = src.split("\n");
  if (b.type === "callout") L[b.line] = L[b.line].replace(/\[!\w+\]/, `[!${v}]`);
  else if (b.type === "code") {
    L[b.line] = L[b.line].replace(/\s*nochrome/, "");
    if (v === "bare") L[b.line] = L[b.line].replace(/(\s*\{[\d,\s|-]+\})?$/, " nochrome$1");
  } else if (b.bare) {
    L.splice(b.line + (b.rows?.length ?? 0), 0, ":::");
    L.splice(b.line, 0, `:::list style=${v}`);
  } else if (/style=\w+/.test(L[b.line])) L[b.line] = L[b.line].replace(/style=\w+/, `style=${v}`);
  else L[b.line] += ` style=${v}`;
  return L.join("\n");
}

/** Set a `key=value` argument on a fence header line. */
export function setFenceArg(src: string, line: number, key: string, value: string): string {
  const L = src.split("\n");
  const re = new RegExp(`\\b${key}=\\S+`);
  L[line] = re.test(L[line]) ? L[line].replace(re, `${key}=${value}`) : `${L[line]} ${key}=${value}`;
  return L.join("\n");
}

/** Blocks whose rows start with an icon cell: `- icon | Title | text`. */
export const hasRowIcons = (b: Block) => (b.type === "cards" || b.type === "flow") && !b.mermaid && !b.bare && (b.rows?.length ?? 0) > 0;

/** Set the icon (first cell) of row `row` inside a fenced cards/flow block. */
export function setRowIcon(src: string, b: Block, row: number, icon: string): string {
  const L = src.split("\n");
  const { start, end } = blockRange(src, b);
  let k = -1;
  for (let i = start + 1; i < end; i++) {
    if (!L[i].trim()) continue;
    if (++k !== row) continue;
    const m = L[i].match(/^(\s*[-*]\s+)(.*)$/);
    if (!m) return src;
    const [, marker, rest] = m;
    L[i] = marker + (rest.includes("|") ? rest.replace(/^[^|]*/, `${icon} `) : `${icon} | ${rest}`);
    return L.join("\n");
  }
  return src;
}

/** Insert `text` at character `offset` (clamped). */
export const insertAtOffset = (src: string, offset: number, text: string) => {
  const at = Math.max(0, Math.min(src.length, offset));
  return src.slice(0, at) + text + src.slice(at);
};
