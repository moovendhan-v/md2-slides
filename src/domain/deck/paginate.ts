import type { Block, Deck, Slide } from "@/engine/types";
import { MEDIA_LAYOUTS } from "./constants";
import type { DeckOptions } from "./look";
import { BLOCK_GAP, blockHeight, contentFrame, headerHeight, type Frame } from "./measure";

/**
 * Split slides whose content would overflow into continuation slides
 * (numbered 1a, 1b, 1c …). Display-only: the Markdown is untouched, and every
 * part keeps its source slide's `startLine` so edits still target the original.
 * Opt out per slide with `<!-- split: false -->`.
 */

/** Headroom kept free on each page; `useFitToSlide` scales any residual overflow. */
const SAFETY = 0.97;
/** Don't start a row-split chunk in less space than this (cqw) — begin a new page instead. */
const MIN_CHUNK_ROOM = 9;
/** Blocks taller than this share of a page may be split across pages. */
const BIG_BLOCK = 0.4;
/** Pages at least this full start a new page for a section that won't fit, rather than splitting it. */
const SECTION_FILL = 0.5;

/** Blocks that can be cut between rows, and how. */
const SPLITTABLE: Partial<Record<Block["type"], { count: (b: Block) => number; slice: (b: Block, from: number, to: number) => Block }>> = {
  code: { count: (b) => b.code?.length ?? 0, slice: (b, f, t) => ({ ...b, code: b.code!.slice(f, t), codeOffset: (b.codeOffset ?? 0) + f }) },
  terminal: { count: (b) => b.rows?.length ?? 0, slice: (b, f, t) => ({ ...b, rows: b.rows!.slice(f, t) }) },
  list: { count: (b) => b.rows?.length ?? 0, slice: (b, f, t) => ({ ...b, rows: b.rows!.slice(f, t) }) },
  table: { count: (b) => b.tableRows?.length ?? 0, slice: (b, f, t) => ({ ...b, tableRows: b.tableRows!.slice(f, t) }) },
};

function canSplitSlide(sl: Slide): boolean {
  if (sl.dir.split === "false" || sl.dir.zoom) return false;
  if (sl.layout.startsWith("custom:") || MEDIA_LAYOUTS.includes(sl.layout)) return false;
  return sl.groups.filter((g) => g.length).length === 1;
}

function titleSize(sl: Slide, o: DeckOptions, blocks: number) {
  if (sl.dir.titleSize) return +sl.dir.titleSize;
  return (blocks > 2 ? 3.4 : 4.2) * o.titleScale;
}

/** Cut an oversized block into row chunks that each fit `room` (first chunk) / `full` (later chunks). */
function chunk(b: Block, h: number, room: number, full: number, f: Frame): Block[] {
  const s = SPLITTABLE[b.type];
  const n = s?.count(b) ?? 0;
  if (!s || n < 2) return [b];
  const perRow = Math.max(0.5, (h - blockHeight(s.slice(b, 0, 0), f.width, f)) / n);
  const fixed = h - perRow * n;
  const out: Block[] = [];
  let from = 0;
  let space = room;
  while (from < n) {
    const fit = Math.max(1, Math.floor((space - fixed) / perRow));
    out.push({ ...s.slice(b, from, Math.min(n, from + fit)), source: b.source ?? b });
    from += fit;
    space = full;
  }
  return out;
}

function pages(sl: Slide, o: DeckOptions, f: Frame): Block[][] {
  const blocks = sl.groups.find((g) => g.length) ?? [];
  const ts = titleSize(sl, o, blocks.length);
  const cap = f.height * SAFETY;
  const first = headerHeight(sl, ts, f) + 0.6;
  const cont = headerHeight({ title: sl.title, kicker: "", body: "" }, ts, f) + 0.6;
  const out: Block[][] = [[]];
  let used = first;
  const room = () => cap - used - (out[out.length - 1].length ? BLOCK_GAP : 0);
  const newPage = () => {
    out.push([]);
    used = cont;
  };
  const heights = blocks.map((b) => blockHeight(b, f.width, f));
  /** Height of the section a heading opens: the heading and blocks up to the next heading. */
  const sectionHeight = (i: number) => {
    let h = heights[i];
    for (let k = i + 1; k < blocks.length && blocks[k].type !== "heading"; k++) h += BLOCK_GAP + heights[k];
    return h;
  };
  blocks.forEach((b, i) => {
    const h = heights[i];
    // Start a section on a fresh page when it fits there but not in the rest of this one.
    if (b.type === "heading" && out[out.length - 1].length && used > cap * SECTION_FILL) {
      const sec = sectionHeight(i);
      if (sec > room() && sec <= cap - cont) newPage();
    }
    // Keep a heading with the block that follows it.
    const next = blocks[i + 1];
    if (b.type === "heading" && next && out[out.length - 1].length && h + BLOCK_GAP + Math.min(blockHeight(next, f.width, f), MIN_CHUNK_ROOM * 2) > room()) newPage();
    if (h <= room()) {
      used += h + (out[out.length - 1].length ? BLOCK_GAP : 0);
      out[out.length - 1].push(b);
      return;
    }
    if (out[out.length - 1].length && room() < MIN_CHUNK_ROOM) newPage();
    // Large row-based blocks flow into the remaining space; small ones move whole.
    const big = h > cap - cont || (h > cap * BIG_BLOCK && room() >= MIN_CHUNK_ROOM);
    const parts = big ? chunk(b, h, room(), cap - cont - BLOCK_GAP, f) : [b];
    parts.forEach((p, k) => {
      const ph = blockHeight(p, f.width, f);
      if (out[out.length - 1].length && (k > 0 || ph > room())) newPage();
      used += ph + (out[out.length - 1].length ? BLOCK_GAP : 0);
      out[out.length - 1].push(p);
    });
  });
  return out.filter((p, i) => p.length || i === 0);
}

export function paginate(deck: Deck, o: DeckOptions): Deck {
  const f = contentFrame(o);
  const total = deck.slides.length;
  const slides = deck.slides.flatMap((sl, i): Slide[] => {
    const base = { ...sl, sourceIndex: i, sourceTotal: total, part: 0, parts: 1 };
    if (!canSplitSlide(sl)) return [base];
    const ps = pages(sl, o, f);
    if (ps.length < 2) return [base];
    return ps.map((blocks, k) => ({
      ...base,
      part: k,
      parts: ps.length,
      kicker: k ? "" : sl.kicker,
      body: k ? "" : sl.body,
      notes: k ? "" : sl.notes,
      groups: [blocks],
      anchorLine: k ? blocks[0]?.line : undefined,
    }));
  });
  return { ...deck, slides };
}

/** Part suffix: a…z, then aa, ab … (spreadsheet-style). */
export function partLetters(k: number): string {
  let s = "";
  for (let n = k + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(97 + ((n - 1) % 26)) + s;
  return s;
}

/** "01", or "01a" / "01b" for continuation parts. */
export function slideNumber(sl: Slide, i: number) {
  const n = String((sl.sourceIndex ?? i) + 1).padStart(2, "0");
  return (sl.parts ?? 1) > 1 ? n + partLetters(sl.part ?? 0) : n;
}

/** Number of authored slides (continuations excluded). */
export const sourceCount = (deck: Deck) => deck.slides[0]?.sourceTotal ?? deck.slides.length;
