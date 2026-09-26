import type { Deck } from "@/engine/types";

/** Slide-level source edits. All functions are pure: (src, …) → new src. */

export function slideRange(src: string, deck: Deck, i: number) {
  const L = src.split("\n");
  const sl = deck.slides[i];
  const nx = deck.slides[i + 1];
  return { L, start: sl.startLine, end: nx ? nx.startLine - 2 : L.length - 1, next: nx };
}

export function duplicateSlide(src: string, deck: Deck, i: number): string {
  const { L, start, end } = slideRange(src, deck, i);
  L.splice(end + 1, 0, "---", ...L.slice(start, end + 1));
  return L.join("\n");
}

export function deleteSlide(src: string, deck: Deck, i: number): string {
  const { L, start, end, next } = slideRange(src, deck, i);
  if (i > 0 && L[start - 1]?.trim() === "---") L.splice(start - 1, end - start + 2);
  else if (next) L.splice(start, next.startLine - start);
  else return src;
  return L.join("\n");
}

/** Insert a new slide after slide `i`. Returns the new source and the line to focus. */
export function insertSlideAfter(src: string, deck: Deck, i: number, md: string) {
  const L = src.split("\n");
  const nx = deck.slides[i + 1];
  const at = nx ? nx.startLine - 1 : L.length;
  L.splice(at, 0, "---", ...md.trim().split("\n"), "");
  return { src: L.join("\n"), focus: at + 1 };
}

/** Replace a lone `/` or blank line, or insert below the caret line. */
export function insertAtLine(src: string, line: number, txt: string) {
  const L = src.split("\n");
  const cur = (L[line] || "").trim();
  const ins = txt.split("\n");
  if (cur === "" || cur === "/") {
    L.splice(line, 1, ...ins);
    return { src: L.join("\n"), focus: line };
  }
  const at = Math.min(line + 1, L.length);
  L.splice(at, 0, "", ...ins);
  return { src: L.join("\n"), focus: at + 1 };
}

export function appendSlides(src: string, md: string): string {
  const L = src.replace(/\n+$/, "").split("\n");
  L.push("---", ...md.trim().split("\n"));
  return L.join("\n") + "\n";
}

/** Trim trailing whitespace and collapse blank-line runs. */
export const formatSource = (src: string) =>
  src
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\n*$/, "\n");

/** Byte offset of the start of `line` (for textarea selection). */
export function lineOffset(src: string, line: number) {
  const L = src.split("\n");
  let off = 0;
  for (let i = 0; i < line && i < L.length; i++) off += L[i].length + 1;
  return { start: off, end: off + (L[line] || "").length };
}
