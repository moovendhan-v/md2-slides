import { parseOutline, segmentSlide, serializeOutline, type Outline, type OutlineSlide, type Segment } from "./outline";

/**
 * Structural edits on the outline: reorder slides, move components between
 * slides, and rewrite a component's or slide's raw Markdown. All pure:
 * (src, …) → new src. Only the slides touched are re-laid-out.
 */

/** Rebuild a slide from its segments, one blank line between each. */
function build(segs: Segment[], leading: boolean): OutlineSlide {
  const lines = [...(leading ? [""] : []), ...segs.flatMap((s, i) => (i ? ["", ...s.lines] : s.lines)), ""];
  return { line: 0, lines, segments: segmentSlide(lines) };
}

const leads = (o: Outline, i: number) => i > 0 || o.head.length > 0;

function edit(src: string, fn: (o: Outline) => boolean | void): string {
  const o = parseOutline(src);
  return fn(o) === false ? src : serializeOutline(o);
}

/** Tidy a slide's padding so it sits cleanly between `---` lines. */
function tidy(o: Outline, i: number) {
  o.slides[i] = build(o.slides[i].segments, leads(o, i));
}

export function moveSlide(src: string, from: number, to: number): string {
  return edit(src, (o) => {
    const n = o.slides.length;
    if (from === to || from < 0 || from >= n || to < 0 || to >= n) return false;
    const [s] = o.slides.splice(from, 1);
    o.slides.splice(to, 0, s);
    for (const i of new Set([from, to, 0, n - 1])) tidy(o, i);
  });
}

/** Keep speaker notes last: they swallow everything below them. */
function insertIndex(segs: Segment[], at: number) {
  const notes = segs.findIndex((s) => s.kind === "notes");
  return notes < 0 ? Math.min(at, segs.length) : Math.min(at, notes);
}

/**
 * Move component `seg` of slide `from` so it lands before component `at` of
 * slide `to` (`at` past the end appends). Indices refer to the outline before
 * the move.
 */
export function moveSegment(src: string, from: number, seg: number, to: number, at: number): string {
  return edit(src, (o) => {
    const a = o.slides[from]?.segments;
    const b = o.slides[to]?.segments;
    if (!a?.[seg] || !b) return false;
    if (from === to && (at === seg || at === seg + 1)) return false;
    const [moved] = a.splice(seg, 1);
    const idx = from === to && at > seg ? at - 1 : at;
    const segs = from === to ? a : b;
    segs.splice(moved.kind === "notes" ? segs.length : insertIndex(segs, idx), 0, moved);
    o.slides[from] = build(a, leads(o, from));
    if (from !== to) o.slides[to] = build(b, leads(o, to));
  });
}

/** Replace component `seg` of slide `i` with `text` (empty text deletes it). */
export function setSegmentText(src: string, i: number, seg: number, text: string): string {
  return edit(src, (o) => {
    const segs = o.slides[i]?.segments;
    if (!segs?.[seg]) return false;
    const body = text.replace(/^\n+|\n+$/g, "");
    if (body) segs.splice(seg, 1, ...segmentSlide(body.split("\n")));
    else segs.splice(seg, 1);
    o.slides[i] = build(segs, leads(o, i));
  });
}

export const removeSegment = (src: string, i: number, seg: number) => setSegmentText(src, i, seg, "");

/** Replace the whole raw body of slide `i`. */
export function setSlideText(src: string, i: number, text: string): string {
  return edit(src, (o) => {
    if (!o.slides[i]) return false;
    o.slides[i] = build(segmentSlide(text.split("\n")), leads(o, i));
  });
}

/** Append `md` as a new component at the end of slide `i` (before notes). */
export function appendSegment(src: string, i: number, md: string): string {
  return edit(src, (o) => {
    const segs = o.slides[i]?.segments;
    if (!segs) return false;
    segs.splice(insertIndex(segs, segs.length), 0, ...segmentSlide(md.trim().split("\n")));
    o.slides[i] = build(segs, leads(o, i));
  });
}

/** Delete slide `i` (the last remaining slide is kept). */
export function removeSlide(src: string, i: number): string {
  return edit(src, (o) => {
    if (o.slides.length < 2 || !o.slides[i]) return false;
    o.slides.splice(i, 1);
    tidy(o, 0);
    tidy(o, o.slides.length - 1);
  });
}

/** Append a new slide holding `md`, padded like its neighbours. */
export function addSlide(src: string, md: string): string {
  return edit(src, (o) => {
    o.slides.push(build(segmentSlide(md.trim().split("\n")), true));
    tidy(o, o.slides.length - 2);
  });
}
