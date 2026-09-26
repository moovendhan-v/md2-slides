import type { Look } from "@/domain/deck/look";

type Mermaid = typeof import("mermaid").default;

let lib: Promise<Mermaid> | null = null;
let queue: Promise<unknown> = Promise.resolve();
let seq = 0;
const cache = new Map<string, Promise<string>>();
/** Pre-rendered SVG by source (HTML export / share links), used before the library. */
const preset = new Map<string, string>();

export function seedMermaid(svgs: Record<string, string> | undefined) {
  for (const [code, svg] of Object.entries(svgs ?? {})) preset.set(code, svg);
}

/** Mermaid theme variables derived from the deck look, so diagrams match the slides. */
function themeFor(look: Look) {
  const dark = look.mode === "dark";
  return {
    darkMode: dark,
    background: "transparent",
    fontFamily: look.font,
    fontSize: "16px",
    primaryColor: dark ? "#18181b" : "#f4f4f5",
    primaryBorderColor: look.accent,
    primaryTextColor: look.fg,
    secondaryColor: dark ? "#27272a" : "#e4e4e7",
    tertiaryColor: dark ? "#09090b" : "#ffffff",
    lineColor: look.muted,
    textColor: look.fg,
    noteBkgColor: dark ? "#27272a" : "#fef9c3",
    noteTextColor: look.fg,
    actorBkg: dark ? "#18181b" : "#f4f4f5",
    actorBorder: look.accent,
    actorTextColor: look.fg,
    signalColor: look.fg,
    signalTextColor: look.fg,
    pie1: look.accent,
  };
}

/**
 * Render Mermaid source to SVG. The library is loaded on first use, renders
 * run one at a time (Mermaid keeps global state) and results are cached per
 * source + theme, so the preview, strip and presenter share one render.
 */
export function renderMermaid(code: string, look: Look): Promise<string> {
  const ready = preset.get(code);
  if (ready) return Promise.resolve(ready);
  const theme = themeFor(look);
  const key = JSON.stringify([code, theme]);
  const hit = cache.get(key);
  if (hit) return hit;
  lib ??= import("mermaid").then((m) => m.default);
  const job = queue.then(async () => {
    const mermaid = await lib!;
    mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "base", themeVariables: theme, flowchart: { htmlLabels: false }, fontFamily: look.font });
    const { svg } = await mermaid.render(`sw-mermaid-${++seq}`, code);
    return svg;
  });
  queue = job.catch(() => undefined);
  cache.set(key, job);
  job.catch(() => cache.delete(key));
  return job;
}
