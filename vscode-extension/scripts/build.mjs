#!/usr/bin/env node
/**
 * Builds the VS Code extension from the same sources as the web app:
 *   dist/extension.js      extension host (vscode-extension/src)
 *   dist/webview/main.js   the Slidewise UI (src/embed/vscode → src/**), plus lazy chunks/
 *   dist/webview/app.css   Tailwind, compiled from src/app/globals.css
 *   dist/webview/*.wasm    the prebuilt slide engine (public/wasm)
 * Usage: node vscode-extension/scripts/build.mjs [--dev]
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ext = join(dirname(fileURLToPath(import.meta.url)), "..");
const root = join(ext, "..");
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
  esbuild.build({
    entryPoints: [join(root, "src/embed/vscode/main.tsx")],
    outdir: join(out, "webview"),
    entryNames: "main",
    // Heavy, rarely used libraries (Mermaid, the icon catalog) load as separate chunks on demand.
    splitting: true,
    chunkNames: "chunks/[name]-[hash]",
    tsconfig: join(root, "tsconfig.json"),
    bundle: true,
    platform: "browser",
    format: "esm",
    target: "es2022",
    jsx: "automatic",
    loader: { ".woff2": "file", ".woff": "file", ".ttf": "file", ".svg": "file", ".eot": "file" },
    define: {
      "process.env.NODE_ENV": JSON.stringify(dev ? "development" : "production"),
      "process.env.NEXT_PUBLIC_TEMPLATE_SOURCE": '""',
    },
    sourcemap: dev,
    minify: !dev,
    logLevel: "warning",
    logOverride: { "unsupported-directive": "silent", "empty-import-meta": "silent" },
  }),
]);

// Tailwind scans the repo (respecting .gitignore) for classes, like `next build` does.
const cli = join(root, "node_modules/@tailwindcss/cli/dist/index.mjs");
execFileSync(process.execPath, [cli, "-i", join(root, "src/app/globals.css"), "-o", join(out, "webview/app.css"), ...(dev ? [] : ["--minify"])], { cwd: root, stdio: ["ignore", "ignore", "inherit"] });

// Webviews are Chromium: woff2 is enough, the other icon-font formats only add weight.
for (const f of readdirSync(join(out, "webview"))) if (/\.(ttf|woff|svg|eot)$/.test(f)) rmSync(join(out, "webview", f));

copyFileSync(join(root, "public/wasm/slide_engine_bg.wasm"), join(out, "webview/slide_engine_bg.wasm"));
console.log(`Slidewise extension built in ${Date.now() - t0} ms → ${out}`);
