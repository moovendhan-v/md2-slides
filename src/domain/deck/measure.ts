import type { Block, Slide } from "@/engine/types";
import type { DeckOptions } from "./look";
import { rowCells } from "./rows";

/**
 * Approximate rendered heights in container-query units (cqw: 1% of slide
 * width), mirroring the sizes used by the block components. Used to decide
 * when a slide overflows and must continue on the next one.
 */

const ASPECT_H: Record<DeckOptions["aspectKey"], number> = { "16:9": 56.25, "4:3": 75, "1:1": 100 };
const DENSITY: Record<DeckOptions["density"], number> = { compact: 0.8, normal: 1, roomy: 1.2 };
export const BLOCK_GAP = 1.5;

/** Visible characters (inline markers removed). */
const visible = (t = "") => t.replace(/\*\*|==|~~|`|\[([^\]]*)\]\([^)]*\)/g, "$1").length;

/** Average glyph advance for the UI fonts, in em. */
const CHAR_EM = 0.47;

/** Lines needed for `text` at `size` cqw in a box `width` cqw wide. */
export const lines = (text: string | undefined, size: number, width: number) => Math.max(1, Math.ceil((visible(text) * size * CHAR_EM) / Math.max(4, width)));

export interface Frame {
  /** Usable content height and width inside the padding. */
  height: number;
  width: number;
  body: number;
  bullet: number;
}

export function contentFrame(o: DeckOptions): Frame {
  const d = DENSITY[o.density] ?? 1;
  return { height: ASPECT_H[o.aspectKey] - 11.2 * d, width: 100 - 12.8 * d, body: 2 * o.bodyScale, bullet: 1.95 * o.bodyScale };
}

type Estimator = (b: Block, w: number, f: Frame) => number;

const rows = (b: Block) => b.rows?.length ?? 0;
const codeLine = 1.45 * 1.65;

/** One estimator per block type — keep in step with `components/slide/blocks`. */
const ESTIMATE: Record<Block["type"], Estimator> = {
  heading: (b, w) => lines(b.text, 2.1, w) * 2.5,
  para: (b, w, f) => lines(b.text, f.body, w) * f.body * 1.45,
  list: (b, w, f) => {
    const boxed = b.args?.style === "boxed";
    return (b.rows ?? []).reduce((h, r) => h + lines(r, f.bullet, w - 4) * f.bullet * 1.35 + (boxed ? 4 : 1.3), 0);
  },
  stats: (b) => Math.ceil(rows(b) / 4) * (b.args?.style === "big" ? 17 : 15),
  cards: (b, w) => {
    const n = rows(b);
    const cols = +(b.args?.cols ?? 0) || Math.min(n, n === 4 ? 2 : 3) || 1;
    const textLines = Math.max(1, ...(b.rows ?? []).map((r) => lines(rowCells(r)[2], 1.55, w / cols - 5)));
    const card = (b.args?.style === "iconLeft" ? 5 : 11) + textLines * 2.25;
    return Math.ceil(n / cols) * (card + 1.8);
  },
  flow: (b, w) => {
    const s = b.args?.style || "pipeline";
    if (s === "hub" || s === "cycle") return w / 2.4;
    if (s === "stack" || s === "funnel" || s === "pyramid") return rows(b) * 4.8;
    return s === "steps" ? 12 : 13;
  },
  timeline: (b) => (b.args?.style === "v" ? rows(b) * 4.6 : 9),
  terminal: (b) => 6 + rows(b) * 1.45 * 1.7,
  // Mermaid diagrams are capped at 30cqw tall (globals.css `.m2s-mermaid`).
  code: (b) => (b.mermaid ? 30 : (b.args?.style === "bare" ? 3.2 : 6.2) + (b.code?.length ?? 0) * codeLine),
  table: (b, w) => {
    const cols = Math.max(1, b.head?.length ?? 1);
    const cw = w / cols - 3.2;
    const row = (cells: string[], size: number) => Math.max(...cells.map((c) => lines(c, size, cw))) * size * 1.4 + 2.4;
    return row(b.head ?? [""], 1.25) + (b.tableRows ?? []).reduce((h, r) => h + row(r, 1.6), 0);
  },
  callout: (b, w) => 5.6 + lines(b.text, 1.8, w - 6) * 2.5,
  quote: (b, w) => 5 + lines(b.text, 4.8, w * 0.88) * 5.3,
  chart: (b) => ({ bar: rows(b) * 3.1 + 4, line: 26, donut: 22, pie: 22, rings: 18 })[b.args?.style ?? ""] ?? 25,
  gallery: (b, w) => {
    const n = rows(b);
    const cols = b.args?.style === "strip" ? n : Math.min(n, n === 4 ? 2 : 3) || 1;
    return Math.ceil(n / cols) * ((w / cols) * 0.75 + 2.5);
  },
  image: (b, w) => {
    const a = b.args ?? {};
    if (a.h) return +a.h;
    const [x, y] = (a.ar || "16:9").split(":").map(Number);
    return ((w * (+a.w || 100)) / 100) * ((y || 9) / (x || 16));
  },
  // Developer power blocks
  math: () => 10,  // KaTeX block display
  csv: (b) => {
    const s = b.args?.style ?? "table";
    const r = rows(b);
    if (s === "table") return 4 + r * 3.2;
    if (s === "bar") return 4 + r * 3.4;
    return 24; // column / line charts
  },
  counter: (b) => rows(b) <= 1 ? 16 : 14,
};

export const blockHeight = (b: Block, width: number, f: Frame) => (ESTIMATE[b.type] ?? (() => 6))(b, width, f);

/** Height of kicker + title + body above the blocks. */
export function headerHeight(sl: Pick<Slide, "kicker" | "title" | "body">, titleSize: number, f: Frame) {
  let h = 0;
  if (sl.kicker) h += 3.2 + 1.8;
  if (sl.title) h += lines(sl.title, titleSize, f.width) * titleSize * 1.05 + 1.8;
  if (sl.body) h += lines(sl.body, f.body, f.width * 0.74) * f.body * 1.4 + 1.8;
  return h;
}
