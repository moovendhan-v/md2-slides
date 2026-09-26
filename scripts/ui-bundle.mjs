/**
 * Shared builders for packaging the Slidewise UI outside Next.js
 * (the VS Code webview and the standalone player used by the HTML export).
 */
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Bundle a browser entry from `src/` with the app's tsconfig paths.
 * `fonts`: "file" emits font files next to the CSS; "inline" embeds woff2 as
 * data URLs (and drops the legacy formats). `stubs` replaces modules by name.
 */
export function bundleUi({ entry, outdir, entryNames = "main", format = "esm", splitting = false, fonts = "file", stubs = {}, dev = false }) {
  const legacy = fonts === "inline" ? "empty" : "file";
  return esbuild.build({
    entryPoints: [join(root, entry)],
    outdir,
    entryNames,
    splitting,
    chunkNames: "chunks/[name]-[hash]",
    tsconfig: join(root, "tsconfig.json"),
    bundle: true,
    platform: "browser",
    format,
    target: "es2022",
    jsx: "automatic",
    loader: { ".woff2": fonts === "inline" ? "dataurl" : "file", ".woff": legacy, ".ttf": legacy, ".svg": legacy, ".eot": legacy },
    alias: stubs,
    define: {
      "process.env.NODE_ENV": JSON.stringify(dev ? "development" : "production"),
      "process.env.NEXT_PUBLIC_TEMPLATE_SOURCE": '""',
    },
    sourcemap: dev,
    minify: !dev,
    logLevel: "warning",
    logOverride: { "unsupported-directive": "silent", "empty-import-meta": "silent" },
  });
}

/** Compile Tailwind from src/app/globals.css (scans the repo, respecting .gitignore, like `next build`). */
export function buildTailwind(outfile, dev = false) {
  const cli = join(root, "node_modules/@tailwindcss/cli/dist/index.mjs");
  execFileSync(process.execPath, [cli, "-i", join(root, "src/app/globals.css"), "-o", outfile, ...(dev ? [] : ["--minify"])], { cwd: root, stdio: ["ignore", "ignore", "inherit"] });
}

export const WASM = join(root, "public/wasm/slide_engine_bg.wasm");
