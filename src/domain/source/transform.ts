import type { Block } from "@/engine/types";
import type { TransformTarget } from "@/domain/deck/constants";
import { blockRange } from "./blocks";
import { listText, rowCells as cells } from "@/domain/deck/rows";

/** Convert a block's rows into another block type (list → cards, stats → chart …). */

interface Item {
  icon: string;
  t: string;
  sub: string;
}

const num = (x: string, k: number) => {
  const n = parseFloat(String(x || "").replace(/[^\d.-]/g, ""));
  return isNaN(n) ? (k + 1) * 20 : n;
};

/** Normalise any row-based block into generic items (icon, title, detail). */
const READERS: Partial<Record<Block["type"], (b: Block) => Item[]>> = {
  list: (b) =>
    (b.rows ?? []).map((r) => {
      const t = listText(r);
      const [a, c] = t.split(/\s+[—–-]\s+/);
      return { icon: "check", t: a, sub: c || "" };
    }),
  cards: (b) => (b.rows ?? []).map((r) => { const [i, t, s] = cells(r); return { icon: i, t, sub: s || "" }; }),
  flow: (b) => (b.rows ?? []).map((r) => { const [i, t, s] = cells(r); return { icon: i, t, sub: s || "" }; }),
  timeline: (b) => (b.rows ?? []).map((r) => { const [w, t] = cells(r); return { icon: "clock", t: (t || "").replace(/\?$/, ""), sub: w }; }),
  stats: (b) => (b.rows ?? []).map((r) => { const [v, l] = cells(r); return { icon: "chart-bar", t: l || "", sub: v }; }),
  chart: (b) => (b.rows ?? []).map((r) => { const [l, v] = cells(r); return { icon: "chart-bar", t: l, sub: v || "" }; }),
  table: (b) => (b.tableRows ?? []).map((r) => ({ icon: "cube", t: r[0], sub: r.slice(1).join(" · ") })),
};

const fence = (head: string, rows: string[]) => [head, ...rows, ":::"];

/** Writers produce the new source lines for each target type. */
const WRITERS: Record<TransformTarget, (items: Item[]) => string[]> = {
  list: (it) => fence(":::list style=dot", it.map((x) => `- ${x.t}${x.sub ? " — " + x.sub : ""}`)),
  cards: (it) => fence(":::cards style=grid", it.map((x) => `- ${x.icon || "cube"} | ${x.t} | ${x.sub}`)),
  flow: (it) => fence(":::flow style=pipeline", it.map((x) => `- ${x.icon || "cube"} | ${x.t} | ${x.sub}`)),
  timeline: (it) => fence(":::timeline style=h", it.map((x, k) => `- ${x.sub && x.sub.length < 12 ? x.sub : "Step " + (k + 1)} | ${x.t}`)),
  stats: (it) => fence(":::stats style=boxed", it.map((x, k) => `- ${x.sub && x.sub.length < 10 ? x.sub : String(num(x.sub, k))} | ${x.t}`)),
  chart: (it) => fence(":::chart style=column", it.map((x, k) => `- ${x.t} | ${num(x.sub, k)}`)),
  table: (it) => ["| Item | Detail |", "|---|---|", ...it.map((x) => `| ${x.t} | ${x.sub || ""} |`)],
};

export const canTransform = (b: Block) => b.type in READERS;

export function transformBlock(src: string, b: Block, to: TransformTarget): string {
  const read = READERS[b.type];
  if (!read) return src;
  const r = blockRange(src, b);
  const L = src.split("\n");
  L.splice(r.start, r.end - r.start + 1, ...WRITERS[to](read(b)));
  return L.join("\n");
}
