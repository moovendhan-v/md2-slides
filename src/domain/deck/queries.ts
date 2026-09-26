import type { Deck, Slide } from "@/engine/types";
import type { DeckOptions } from "./look";

/** Read-only questions about a parsed deck. */

export const blockCount = (sl: Slide) => sl.groups.reduce((a, g) => a + g.length, 0);

export function codeSteps(sl: Slide): number {
  let n = 0;
  sl.groups.flat().forEach((b) => {
    if (b.type === "code" && b.steps) n = Math.max(n, b.steps.length - 1);
  });
  return n;
}

export function codeLines(sl: Slide | undefined): Set<string> {
  const s = new Set<string>();
  sl?.groups.flat().forEach((b) => b.type === "code" && b.code?.forEach((l) => s.add(l.trim())));
  return s;
}

export const clicksEnabled = (sl: Slide, o: DeckOptions) => (sl.dir.clicks ? sl.dir.clicks !== "false" : o.clicks);

/** Number of → presses a slide consumes before advancing. */
export const clickCount = (sl: Slide | undefined, o: DeckOptions) =>
  sl ? Math.max(clicksEnabled(sl, o) ? blockCount(sl) : 0, codeSteps(sl)) : 0;

/** Index of the slide containing `line`. */
export function slideAtLine(deck: Deck, line: number): number {
  let k = 0;
  deck.slides.forEach((s, i) => {
    if ((s.anchorLine ?? s.startLine) <= line) k = i;
  });
  return k;
}

export const slideFocusLine = (sl: Slide) => sl.anchorLine ?? (sl.titleLine >= 0 ? sl.titleLine : sl.startLine);

export const slideLabel = (sl: Slide, i: number) => sl.title || sl.kicker || sl.groups[0]?.[0]?.type || `Slide ${i + 1}`;

/** Resolve `a/b/../c.md` relative paths inside a repo. */
export function resolveRelative(fromFile: string, rel: string): string {
  const base = fromFile.includes("/") ? fromFile.slice(0, fromFile.lastIndexOf("/") + 1) : "";
  const st: string[] = [];
  (base + rel.replace(/^\.\//, "")).split("/").forEach((x) => (x === ".." ? st.pop() : st.push(x)));
  return st.join("/");
}
