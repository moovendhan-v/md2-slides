import { FONTS, PALETTES } from "./constants";

/** Deck-level options read from front-matter (with defaults). */
export interface DeckOptions {
  palette: string;
  mode: "dark" | "light";
  accent: string;
  bg: string;
  glass: boolean;
  font: string;
  radius: number;
  density: "compact" | "normal" | "roomy";
  aspectKey: "16:9" | "4:3" | "1:1";
  footer: string;
  nums: boolean;
  bar: boolean;
  logo: string;
  clicks: boolean;
  titleScale: number;
  bodyScale: number;
  animate: string;
  transition: string;
  stagger: number;
}

const ASPECTS = { "16:9": "16 / 9", "4:3": "4 / 3", "1:1": "1 / 1" } as const;

export function deckOptions(m: Record<string, string>): DeckOptions {
  const aspectKey = (m.aspect in ASPECTS ? m.aspect : "16:9") as DeckOptions["aspectKey"];
  return {
    palette: m.theme || "zinc",
    mode: m.mode === "light" ? "light" : "dark",
    accent: m.accent || "#60a5fa",
    bg: m.bg || "solid",
    glass: m.glass === "true",
    font: m.font || "geist",
    radius: m.radius != null ? +m.radius : 12,
    density: (["compact", "roomy"].includes(m.density) ? m.density : "normal") as DeckOptions["density"],
    aspectKey,
    footer: m.footer || "",
    nums: m.nums !== "false",
    bar: m.bar === "true",
    logo: m.logo || "",
    clicks: m.clicks === "true",
    titleScale: +m.titleScale || 1,
    bodyScale: +m.bodyScale || 1,
    animate: m.animate || "fade-up",
    transition: m.transition || "fade",
    stagger: +m.stagger || 90,
  };
}

export interface CardSurface {
  bg: string;
  ring: string;
  blur: string;
}

/** Fully resolved design tokens for rendering one deck. */
export interface Look {
  mode: "dark" | "light";
  glass: boolean;
  aspect: string;
  fg: string;
  muted: string;
  panel: string;
  rule: string;
  accent: string;
  bgCss: string;
  bgSolid: string;
  font: string;
  headFont: string;
  mono: string;
  headW: number;
  headLs: string;
  radius: string;
  r: string;
  pad: string;
  gap: string;
  sp: number;
  chip: string;
  codeBg: string;
  bodySize: string;
  bulletSize: string;
  titleScale: number;
  anim: string;
  stagger: number;
  codeSize: string;
  tableSize: string;
  bar: boolean;
  logo: string;
  clicks: boolean;
  nums: boolean;
  footer: string;
  card: CardSurface;
  ink: string;
}

export const hexA = (h: string, a: number) => {
  const n = parseInt(h.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

function background(id: string, bg: string, acc: string, dark: boolean, rule: string, ink: string) {
  const g = (a: number) => hexA(acc, a);
  const map: Record<string, string> = {
    solid: bg,
    gradient: `linear-gradient(135deg, ${g(dark ? 0.22 : 0.14)} 0%, ${bg} 55%)`,
    mesh: `radial-gradient(60% 70% at 85% 10%, ${g(dark ? 0.35 : 0.22)}, transparent 70%), radial-gradient(50% 60% at 5% 100%, ${hexA(dark ? "#a855f7" : "#f472b6", dark ? 0.22 : 0.15)}, transparent 70%), ${bg}`,
    grid: `linear-gradient(${rule} 1px, transparent 1px) 0 0/4cqw 4cqw, linear-gradient(90deg, ${rule} 1px, transparent 1px) 0 0/4cqw 4cqw, ${bg}`,
    dots: `radial-gradient(${ink}.14) .12cqw, transparent .14cqw) 0 0/2.4cqw 2.4cqw, ${bg}`,
    spotlight: `radial-gradient(70% 80% at 50% -10%, ${g(dark ? 0.3 : 0.18)}, transparent 70%), ${bg}`,
  };
  return map[id] || bg;
}

export function buildLook(o: DeckOptions): Look {
  const P = PALETTES[o.palette] || PALETTES.zinc;
  const dark = o.mode !== "light";
  const [bg, fg, muted, panel] = dark ? P.dark : P.light;
  const F = FONTS[o.font] || FONTS.geist;
  const acc = o.accent || "#60a5fa";
  const d = { compact: 0.8, normal: 1, roomy: 1.2 }[o.density] || 1;
  const rule = dark ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.1)";
  const ink = dark ? "rgba(255,255,255," : "rgba(0,0,0,";
  const glassCard: CardSurface = {
    bg: dark ? "rgba(255,255,255,.06)" : "rgba(255,255,255,.55)",
    ring: `inset 0 0 0 1px ${dark ? "rgba(255,255,255,.14)" : "rgba(255,255,255,.8)"}, 0 1cqw 3cqw ${ink}.12)`,
    blur: "blur(1.4cqw) saturate(1.4)",
  };
  return {
    mode: dark ? "dark" : "light",
    glass: o.glass,
    aspect: ASPECTS[o.aspectKey],
    fg, muted, panel, rule, ink,
    accent: acc,
    bgCss: background(o.bg, bg, acc, dark, rule, ink),
    bgSolid: bg,
    font: F.body, headFont: F.head, mono: F.mono, headW: F.w, headLs: F.ls,
    radius: o.radius > 0 ? "1.2cqw" : "0",
    r: o.radius / 10 + "cqw",
    pad: `${5.6 * d}cqw ${6.4 * d}cqw`,
    gap: `${1.8 * d}cqw`,
    sp: d,
    chip: hexA(acc, dark ? 0.14 : 0.1),
    codeBg: dark ? "rgba(0,0,0,.35)" : panel,
    bodySize: 2 * o.bodyScale + "cqw",
    bulletSize: 1.95 * o.bodyScale + "cqw",
    titleScale: o.titleScale,
    anim: o.animate,
    stagger: o.stagger,
    codeSize: "1.45cqw",
    tableSize: "1.6cqw",
    bar: o.bar, logo: o.logo, clicks: o.clicks, nums: o.nums, footer: o.footer,
    card: o.glass ? glassCard : { bg: panel, ring: `inset 0 0 0 1px ${rule}`, blur: "none" },
  };
}

/** Look for thumbnails: no numbers or footer chrome. */
export const thumbLook = (look: Look): Look => ({ ...look, nums: false, footer: "" });

export const lookFromMeta = (meta: Record<string, string>) => buildLook(deckOptions(meta));
