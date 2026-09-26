#!/usr/bin/env node
/**
 * Builds the VS Code extension from the same sources as the web app:
 *   dist/extension.js      extension host (vscode-extension/src)
 *   dist/webview/main.js   the Slidewise UI (src/embed/vscode → src/**), plus lazy chunks/
 *   dist/webview/app.css   Tailwind, compiled from src/app/globals.css
 *   dist/webview/*.wasm    the prebuilt slide engine (public/wasm)
 * Usage: node vscode-extension/scripts/build.mjs [--dev]
 */
import { copyFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import * as esbuild from "esbuild";
import { WASM, buildTailwind, bundleUi, root } from "../../scripts/ui-bundle.mjs";

const ext = join(root, "vscode-extension");
const out = join(ext, "dist");
const dev = process.argv.includes("--dev");
const t0 = Date.now();

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "webview"), { recursive: true });

await Promise.all([
  esbuild.build({
    entryPoints: [join(ext, "src/extension.ts")],
    outfile: join(out, "extension.js"),
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node18",
    external: ["vscode"],
    sourcemap: dev,
    minify: !dev,
    logLevel: "warning",
  }),
  // Heavy, rarely used libraries (Mermaid, the icon catalog) load as separate chunks on demand.
  bundleUi({ entry: "src/embed/vscode/main.tsx", outdir: join(out, "webview"), splitting: true, dev }),
]);

buildTailwind(join(out, "webview/app.css"), dev);

// Webviews are Chromium: woff2 is enough, the other icon-font formats only add weight.
for (const f of readdirSync(join(out, "webview"))) if (/\.(ttf|woff|svg|eot)$/.test(f)) rmSync(join(out, "webview", f));

copyFileSync(WASM, join(out, "webview/slide_engine_bg.wasm"));
console.log(`Slidewise extension built in ${Date.now() - t0} ms → ${out}`);
