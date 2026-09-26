/** Standard base64 (not URL-safe) for data: URLs, chunked so large files don't overflow the call stack. */
export function bytesToBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

const escapeHtml = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
/** Keep inlined code from closing its own tag. */
const inlineSafe = (code: string, tag: "script" | "style") => code.replace(new RegExp(`</${tag}`, "gi"), `<\\/${tag}`);

export interface StandaloneParts {
  title: string;
  /** Player bundle (IIFE). */
  js: string;
  css: string[];
  wasmBase64: string;
  /** Encoded share payload (same codec as links, optionally encrypted). */
  encoded: string;
}

/**
 * One self-contained HTML presentation: player, styles, Wasm engine and the
 * deck in a single file that works offline (Google Fonts load when online,
 * system fonts otherwise).
 */
export function standaloneHtml(p: StandaloneParts): string {
  const fonts =
    "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Instrument+Serif&family=JetBrains+Mono:wght@400;500;700&display=swap";
  return `<!doctype html>
<html lang="en" class="dark">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="generator" content="md2slides" />
<title>${escapeHtml(p.title)}</title>
<link rel="stylesheet" href="${fonts}" />
${p.css.map((c) => `<style>${inlineSafe(c, "style")}</style>`).join("\n")}
</head>
<body class="bg-zinc-950 text-[13px] text-zinc-50 antialiased">
<div id="root"></div>
<script>window.__MD2SLIDES_WASM__="data:application/wasm;base64,${p.wasmBase64}";window.__MD2SLIDES_DECK__="${p.encoded}";</script>
<script>${inlineSafe(p.js, "script")}</script>
</body>
</html>
`;
}
