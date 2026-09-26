import type { Slide } from "@/engine/types";

/** Per-slide `<!-- key: value; … -->` directive editing. */

const SCAN = 4;
const isDirective = (l: string) => /^<!--\s*\w+\s*:.*-->$/.test(l.trim());
const isLayout = (l: string) => /^<!--\s*layout:/.test(l.trim());

export function parseDirective(line: string): Record<string, string> {
  const map: Record<string, string> = {};
  line
    .trim()
    .replace(/^<!--\s*|\s*-->$/g, "")
    .split(";")
    .forEach((kv) => {
      const x = kv.match(/^\s*(\w+)\s*:\s*(.*?)\s*$/);
      if (x) map[x[1]] = x[2];
    });
  return map;
}

const render = (map: Record<string, string>) =>
  Object.keys(map).length ? `<!-- ${Object.entries(map).map(([a, b]) => `${a}: ${b}`).join("; ")} -->` : null;

function findLine(L: string[], start: number, test: (l: string) => boolean) {
  for (let i = start; i < Math.min(L.length, start + SCAN); i++) if (test(L[i])) return i;
  return -1;
}

function upsertLine(L: string[], at: number, insertAt: number, line: string | null) {
  if (at >= 0) {
    if (line) L[at] = line;
    else L.splice(at, 1);
  } else if (line) L.splice(insertAt, 0, line);
}

/** Set (or clear with '') a style directive such as `bg`, `accent`, `transition`. */
export function setDirective(src: string, slide: Slide, key: string, value: string | null): string {
  const L = src.split("\n");
  const at = findLine(L, slide.startLine, (l) => isDirective(l) && !/layout:/.test(l));
  const map = at >= 0 ? parseDirective(L[at]) : {};
  if (value === "" || value == null) delete map[key];
  else map[key] = value;
  upsertLine(L, at, slide.startLine, render(map));
  return L.join("\n");
}

const hasMedia = (layout: string) => /^(image|diagonal|circle|arch)/.test(layout);

/** Replace the slide's `<!-- layout: … -->` line (keeps its image for media layouts). */
export function setLayout(src: string, slide: Slide, layout: string): string {
  const L = src.split("\n");
  const at = findLine(L, slide.startLine, isLayout);
  const img = hasMedia(layout) ? `; image: ${slide.dir.image || ""}` : "";
  upsertLine(L, at, slide.startLine, layout ? `<!-- layout: ${layout}${img} -->` : null);
  return L.join("\n");
}

/** Update the `image:` key on the slide's layout line. */
export function setLayoutImage(src: string, slide: Slide, url: string): string {
  const L = src.split("\n");
  const at = findLine(L, slide.startLine, isLayout);
  if (at < 0) return src;
  const map = parseDirective(L[at]);
  map.image = url;
  L[at] = render(map) ?? L[at];
  return L.join("\n");
}

export { hasMedia as isMediaLayout };
