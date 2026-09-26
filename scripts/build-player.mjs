#!/usr/bin/env node
/**
 * Builds the standalone read-only player (src/player/main.tsx) that the HTML
 * export inlines into a single offline file:
 *   public/player/player.js   IIFE bundle (Mermaid stubbed: diagrams are pre-rendered)
 *   public/player/player.css  icon font CSS with the woff2 inlined
 *   public/player/app.css     Tailwind for the UI
 * Runs before `next dev` / `next build`. Usage: node scripts/build-player.mjs [--dev]
 */
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { buildTailwind, bundleUi, root } from "./ui-bundle.mjs";

const out = join(root, "public/player");
const dev = process.argv.includes("--dev");
const t0 = Date.now();
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
await bundleUi({ entry: "src/player/main.tsx", outdir: out, entryNames: "player", format: "iife", fonts: "inline", stubs: { mermaid: join(root, "src/player/mermaid-stub.ts") }, dev });
buildTailwind(join(out, "app.css"), dev);
console.log(`md2slides player built in ${Date.now() - t0} ms → public/player`);
