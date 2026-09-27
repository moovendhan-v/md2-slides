/** Everything a viewer needs to show a deck, carried inside the share link itself. */
export interface SharePayload {
  v: 1;
  /** Deck Markdown. */
  md: string;
  /** Files the deck imports (`<!-- src: -->`, `<<<`), by path relative to the repo root. */
  files?: Record<string, string>;
  /** Path of the deck inside its repo (resolves relative imports). */
  path: string;
  name: string;
  created: number;
  /** Epoch ms after which the viewer refuses the link (undefined = never). */
  expires?: number;
  opts: ShareOptions;
  /** Pre-rendered Mermaid SVG by source (HTML export works offline without the library). */
  svg?: Record<string, string>;
  /** Bundled images & assets as data URLs (supports private repos and offline embedding). */
  assets?: Record<string, string>;
}

export interface ShareOptions {
  notes: boolean;
  download: boolean;
  /** Open straight into presenter mode. */
  present: boolean;
}

export const EXPIRY = { "1h": 3_600_000, "24h": 86_400_000, "7d": 604_800_000, "30d": 2_592_000_000, never: 0 } as const;
export type ExpiryKey = keyof typeof EXPIRY;

export const expiresAt = (key: ExpiryKey, now = Date.now()) => (EXPIRY[key] ? now + EXPIRY[key] : undefined);

export const isExpired = (p: Pick<SharePayload, "expires">, now = Date.now()) => p.expires != null && now > p.expires;

/** "in 3 hours", "in 6 days" … for the viewer header. */
export function expiresIn(p: Pick<SharePayload, "expires">, now = Date.now()): string | null {
  if (p.expires == null) return null;
  const ms = p.expires - now;
  if (ms <= 0) return "expired";
  const n = (v: number, unit: string) => `in ${v} ${unit}${v === 1 ? "" : "s"}`;
  const h = ms / 3_600_000;
  if (h < 1) return n(Math.max(1, Math.round(ms / 60_000)), "minute");
  if (h < 48) return n(Math.round(h), "hour");
  return n(Math.round(h / 24), "day");
}

/**
 * Files a deck imports, so the viewer can resolve them without GitHub:
 * `<!-- src: ./x.md -->` (relative to the deck) and `<<< path` (repo root).
 * `resolve` maps a reference to a repo path; `read` returns its content
 * (undefined when not loaded).
 */
export function collectImports(md: string, resolve: (ref: string, kind: "src" | "import") => string, read: (path: string) => string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  const refs = [
    ...[...md.matchAll(/<!--\s*src:\s*([^\s>]+)\s*-->/g)].map((m) => [m[1], "src"] as const),
    ...[...md.matchAll(/^\s*<<<\s+(\S+)/gm)].map((m) => [m[1].replace(/#.*$/, ""), "import"] as const),
  ];
  for (const [ref, kind] of refs) {
    const path = resolve(ref, kind);
    const text = read(path);
    if (text != null) out[path] = text;
  }
  return out;
}

/** Image paths that are local or relative to the repository. */
export function relativeImages(md: string): string[] {
  const urls: string[] = [];
  // Markdown images ![alt](url)
  for (const m of md.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) urls.push(m[1]);
  // Directive images <!-- ... image: url ... -->
  for (const m of md.matchAll(/<!--[\s\S]*?\bimage:\s*([^\s;>]+)[\s\S]*?-->/g)) urls.push(m[1]);
  // Filter out external http/https and data URIs
  return [...new Set(urls.filter((u) => u && !/^(https?:|data:|\/\/)/i.test(u)))];
}

/**
 * Collects bundled assets from workspace for relative/local images.
 */
export function collectAssets(md: string, resolve: (ref: string) => string, read: (path: string) => string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const img of relativeImages(md)) {
    const path = resolve(img);
    const content = read(path);
    if (content != null) out[img] = content;
  }
  return out;
}
