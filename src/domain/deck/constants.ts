import type { BlockType } from "@/engine/types";

/** Restylable variants per block type (first entry is the default). */
export const VARIANTS: Partial<Record<BlockType, string[]>> = {
  cards: ["grid", "glass", "outline", "numbered", "iconLeft", "accent"],
  stats: ["boxed", "plain", "bar", "big"],
  list: ["dot", "check", "number", "boxed"],
  flow: ["pipeline", "steps", "stack", "hub", "cycle", "funnel", "pyramid"],
  chart: ["column", "bar", "line", "donut", "pie", "rings"],
  gallery: ["grid", "strip", "circles", "mosaic"],
  timeline: ["h", "v"],
  callout: ["NOTE", "TIP", "WARNING", "DANGER", "SUCCESS"],
  terminal: ["chrome", "bare"],
  image: ["cover", "contain", "fill"],
  code: ["chrome", "bare"],
};

export const TRANSFORMS = ["list", "cards", "flow", "timeline", "stats", "chart", "table"] as const;
export type TransformTarget = (typeof TRANSFORMS)[number];

export const TRANSITIONS = [
  "none", "fade", "slide", "slide-right", "slide-up", "slide-down", "push", "zoom", "zoom-out", "flip",
  "flip-x", "cube", "swing", "rotate", "skew", "drop", "blur", "wipe", "wipe-up", "iris", "glitch",
] as const;

export const ANIMS = ["none", "fade", "fade-up", "fade-down", "zoom-in", "slide-left", "blur-in", "pop"] as const;

export const BGS = ["solid", "gradient", "mesh", "grid", "dots", "spotlight"] as const;
export type BgId = (typeof BGS)[number];

export const ACCENTS = ["#60a5fa", "#a78bfa", "#f472b6", "#f87171", "#fb923c", "#facc15", "#4ade80", "#2dd4bf"];

export interface FontPair {
  label: string;
  head: string;
  body: string;
  mono: string;
  w: number;
  ls: string;
}

export const FONTS: Record<string, FontPair> = {
  geist: { label: "Geist", head: "Geist, sans-serif", body: "Geist, sans-serif", mono: '"Geist Mono", monospace', w: 700, ls: "-.035em" },
  grotesk: { label: "Space Grotesk", head: '"Space Grotesk", sans-serif', body: "Geist, sans-serif", mono: '"JetBrains Mono", monospace', w: 600, ls: "-.03em" },
  plex: { label: "IBM Plex", head: '"IBM Plex Sans", sans-serif', body: '"IBM Plex Sans", sans-serif', mono: '"JetBrains Mono", monospace', w: 600, ls: "-.02em" },
  editorial: { label: "Serif", head: '"Instrument Serif", serif', body: "Geist, sans-serif", mono: '"Geist Mono", monospace', w: 400, ls: "-.01em" },
  mono: { label: "Mono", head: '"JetBrains Mono", monospace', body: '"JetBrains Mono", monospace', mono: '"JetBrains Mono", monospace', w: 700, ls: "-.04em" },
};

/** [background, foreground, muted, panel] per mode. */
export interface Palette {
  label: string;
  dark: [string, string, string, string];
  light: [string, string, string, string];
}

export const PALETTES: Record<string, Palette> = {
  zinc: { label: "Zinc", dark: ["#09090b", "#fafafa", "#a1a1aa", "#18181b"], light: ["#ffffff", "#09090b", "#52525b", "#f4f4f5"] },
  slate: { label: "Slate", dark: ["#0b1120", "#f1f5f9", "#94a3b8", "#131c2e"], light: ["#f8fafc", "#0f172a", "#475569", "#eef2f7"] },
  stone: { label: "Stone", dark: ["#0f0d0b", "#faf7f2", "#a8a29e", "#1c1917"], light: ["#faf7f2", "#1c1917", "#57534e", "#f0ebe3"] },
  night: { label: "Midnight", dark: ["#07081a", "#eef0ff", "#9da3c9", "#11132b"], light: ["#f5f6ff", "#11132b", "#4b5078", "#e8eaff"] },
};

export const MEDIA_LAYOUTS = ["image-left", "image-right", "image-full", "image-top", "diagonal", "circle", "arch"];

export const SYNTAX: [string, string][] = [
  ["---", "New slide (front-matter block at top of file sets title/vars/theme)"],
  ["# Title", "Slide title  ·  ### Heading = sub-heading block"],
  ["^ Kicker", "Small eyebrow label above the title"],
  ["- item / - [x] item", "Bullets / checklist"],
  [":::cards style=glass cols=3", "Cards — rows: - icon | Title | text  (close with :::)"],
  [":::stats style=boxed", "Stats — rows: - 42% | Label | +12%"],
  [":::flow style=pipeline", "Diagram — pipeline | steps | stack | hub | cycle | funnel | pyramid. rows: - icon | Title | sub"],
  [":::timeline style=h", "Timeline — h | v. rows: - Q1 | What happened"],
  [":::list style=check", "Bullet style — dot | check | number | boxed"],
  [":::terminal title", "Terminal block, $ lines get a prompt"],
  ["```ts file.ts {2,4}", "Code with filename and highlighted lines"],
  ["> [!TIP] text", "Callout — NOTE | TIP | WARNING | DANGER | SUCCESS"],
  ["> quote  +  — Author", "Pull quote"],
  ["![alt](src)", "Image (empty src = placeholder)"],
  [":::chart style=column", "Chart — column | bar | line | donut | pie | rings. rows: - Label | 42"],
  [":::gallery style=grid", "Images — grid | strip | circles | mosaic. rows: - url | caption"],
  ["<!-- layout: image-right; image: url -->", "Media layouts: image-left | image-right | image-full | image-top | diagonal | circle | arch"],
  ["|||", "Column break"],
  ["<!-- layout: center -->", "Slide layout — left | center | statement"],
  ["<!-- bg: #111; color: #fff -->", "Per-slide: bg (color / gradient / image URL), color, titleColor, pad (e.g. 4 6), align, titleSize, accent"],
  ["{1|2-3|all}", "Code highlight steps — each click moves to the next group"],
  ["```ts file.ts magic", "Magic move: new lines animate in vs the previous slide's code"],
  ["<<< @/src/file.ts#L1-10 {2}", "Import code from the repo (lines, highlight, magic)"],
  ["**b** *i* `code` ==mark== ~~del~~ [link](url) :rocket:", "Inline formatting + icons in any text"],
  ["<!-- zoom: 0.8 -->", "Scale the slide content (fit dense slides)"],
  ["<!-- clicks: true -->", "Reveal blocks one per click while presenting (front-matter clicks: true for all)"],
  ["<!-- src: ./other.md -->", "Import slides from another file in the same repo"],
  ["```mermaid", "Any Mermaid diagram (flowchart, sequence, class, state, ER, gantt, pie, mindmap, timeline, gitGraph …) — rendered and themed"],
  ["<!-- transition: zoom -->", "fade, slide, slide-right, slide-up, slide-down, push, zoom, zoom-out, flip, flip-x, cube, swing, rotate, skew, drop, blur, wipe, wipe-up, iris, glitch, none"],
  ["<!-- animate: fade-up -->", "Block entrance: fade | fade-up | fade-down | zoom-in | slide-left | blur-in | pop | none (+ stagger=120)"],
  ["![alt](src){w=60 h=30 fit=contain r=0}", "Image size (%/cqw), fit cover|contain, radius, pos, filter=grayscale"],
  ["titleScale / bodyScale", "Front-matter type scale multipliers, e.g. titleScale: 1.2"],
  ["${var}", "Front-matter variable"],
  ["Note:", "Speaker notes (rest of slide)"],
];
