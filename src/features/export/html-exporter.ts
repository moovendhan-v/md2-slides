import { prerenderMermaid } from "@/components/slide/mermaid-render";
import { bytesToBase64, standaloneHtml } from "@/domain/export/standalone-html";
import { encodeShare } from "@/domain/share/codec";
import { buildPayload } from "@/features/share/use-share-link";
import type { Exporter } from "./types";

async function asset(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status}). Run \`npm run player:build\`.`);
  return res;
}

/**
 * Single-file HTML presentation: the standalone player (built from
 * src/player), styles, the Wasm engine and the deck — with Mermaid diagrams
 * pre-rendered — so it opens offline by double-click.
 */
export const htmlExporter: Exporter = {
  id: "html",
  label: "HTML presentation",
  icon: "file-html",
  description: "One offline .html file with the full presenter: transitions, reveals, code steps, overview, pen, laser, timer and speaker view.",
  uses: ["notes", "download", "present", "password"],
  async run({ deck, options, name }) {
    const payload = buildPayload(deck, { exp: "never", notes: options.notes, download: options.download, present: options.present });
    payload.svg = await prerenderMermaid(deck.deck.slides, deck.look);
    const [encoded, js, css, app, wasm] = await Promise.all([
      encodeShare(payload, options.password || undefined),
      asset("/player/player.js").then((r) => r.text()),
      asset("/player/player.css").then((r) => r.text()),
      asset("/player/app.css").then((r) => r.text()),
      asset("/wasm/slide_engine_bg.wasm").then((r) => r.arrayBuffer()),
    ]);
    const html = standaloneHtml({ title: payload.name, js, css: [app, css], wasmBase64: bytesToBase64(new Uint8Array(wasm)), encoded });
    return { blob: new Blob([html], { type: "text/html" }), filename: `${name}.html` };
  },
};
