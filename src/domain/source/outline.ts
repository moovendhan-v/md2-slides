import { frontMatterEnd } from "./frontmatter";

/**
 * Line-level outline of a deck: slides split on `---`, and each slide cut into
 * the components (blocks) it is written with. Mirrors the engine's rules
 * (`crates/slide-engine/src/parser`) closely enough to move raw Markdown
 * around without re-rendering it: every non-blank line belongs to exactly one
 * segment, so a slide can be rebuilt from its segments losslessly.
 */

export type SegmentKind =
  | "heading"
  | "kicker"
  | "directive"
  | "comment"
  | "code"
  | "fence"
  | "table"
  | "list"
  | "quote"
  | "callout"
  | "image"
  | "columns"
  | "notes"
  | "para";

export interface Segment {
  kind: SegmentKind;
  /** Short label, e.g. `typescript`, `:::tip`, `## Title`. */
  label: string;
  /** Line range inside the slide (inclusive). */
  start: number;
  end: number;
  lines: string[];
}

export interface OutlineSlide {
  /** Absolute line of the slide's first line (just after its `---`). */
  line: number;
  lines: string[];
  segments: Segment[];
}

export interface Outline {
  /** Front matter including both `---` lines (empty when absent). */
  head: string[];
  slides: OutlineSlide[];
}

const LIST = /^([-*+]|\d+[.)])\s/;

/** Kind of the block starting at trimmed line `l`, or null for a paragraph line. */
function kindOf(l: string): SegmentKind | null {
  if (l.startsWith("```") || l.startsWith("<<<")) return "code";
  if (/^:::\w/.test(l)) return "fence";
  if (l === "|||") return "columns";
  if (l.startsWith("|")) return "table";
  if (l.startsWith("> [!")) return "callout";
  if (l.startsWith(">")) return "quote";
  if (l.startsWith("<!--")) return /^<!--\s*[\w-]+\s*:/.test(l) ? "directive" : "comment";
  if (/^#{1,6}\s/.test(l)) return "heading";
  if (/^\^\s/.test(l)) return "kicker";
  if (l.startsWith("![")) return "image";
  if (/^note:/i.test(l)) return "notes";
  if (LIST.test(l)) return "list";
  return null;
}

/** Last line index of the segment of `kind` starting at `i`. */
function segmentEnd(L: string[], i: number, kind: SegmentKind | null): number {
  const t = (k: number) => L[k]?.trim() ?? "";
  const run = (ok: (l: string) => boolean) => {
    let k = i;
    while (k + 1 < L.length && t(k + 1) && ok(t(k + 1))) k++;
    return k;
  };
  switch (kind) {
    case "code": {
      if (t(i).startsWith("<<<")) return i;
      let k = i + 1;
      while (k < L.length && !t(k).startsWith("```")) k++;
      return Math.min(k, L.length - 1);
    }
    case "fence": {
      let k = i + 1;
      while (k < L.length && t(k) !== ":::") k++;
      return Math.min(k, L.length - 1);
    }
    case "comment":
    case "directive": {
      let k = i;
      while (k < L.length - 1 && !t(k).includes("-->")) k++;
      return k;
    }
    case "notes":
      return L.length - 1;
    case "table":
      return run((l) => l.startsWith("|") && l !== "|||");
    case "quote":
    case "callout":
      return run((l) => l.startsWith(">") && !l.startsWith("> [!"));
    case "list":
      // Items and their indented continuation lines.
      return run((l) => kindOf(l) === "list" || kindOf(l) === null);
    case null:
      return run((l) => kindOf(l) === null);
    default:
      return i;
  }
}

function labelOf(kind: SegmentKind, first: string): string {
  const l = first.trim();
  if (kind === "code") return l.startsWith("<<<") ? "import" : l.slice(3).split(/\s/)[0] || "code";
  if (kind === "fence") return l.split(/\s/)[0];
  if (kind === "heading" || kind === "kicker") return l;
  return kind;
}

export function segmentSlide(L: string[]): Segment[] {
  const out: Segment[] = [];
  for (let i = 0; i < L.length; i++) {
    const l = L[i].trim();
    if (!l) continue;
    const kind = kindOf(l);
    const end = segmentEnd(L, i, kind);
    out.push({ kind: kind ?? "para", label: labelOf(kind ?? "para", l), start: i, end, lines: L.slice(i, end + 1) });
    i = end;
  }
  return out;
}

/** Split `src` into front matter and slides (delimiters excluded). */
export function parseOutline(src: string): Outline {
  const L = src.split("\n");
  const fm = frontMatterEnd(L);
  const head = fm < 0 ? [] : L.slice(0, fm + 1);
  const slides: OutlineSlide[] = [];
  let cur: string[] = [];
  let line = head.length;
  let inCode = false;
  const flush = (next: number) => {
    slides.push({ line, lines: cur, segments: segmentSlide(cur) });
    cur = [];
    line = next;
  };
  for (let i = head.length; i < L.length; i++) {
    const t = L[i].trim();
    if (t.startsWith("```")) inCode = !inCode;
    if (t === "---" && !inCode) flush(i + 1);
    else cur.push(L[i]);
  }
  flush(L.length);
  return { head, slides };
}

export const serializeOutline = (o: Outline) => [...o.head, ...o.slides.flatMap((s, i) => (i ? ["---", ...s.lines] : s.lines))].join("\n");
