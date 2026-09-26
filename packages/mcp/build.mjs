#!/usr/bin/env node
/**
 * Bundle the MCP server (and everything it imports from the app: the Wasm
 * engine glue, share codec, syntax spec, snippets, templates) into one
 * executable ESM file plus the .wasm binary. The package has no runtime deps.
 */
import { chmodSync, copyFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const pkg = dirname(fileURLToPath(import.meta.url));
const root = join(pkg, "../..");
const out = join(pkg, "dist");
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

await esbuild.build({
  entryPoints: [join(pkg, "src/index.ts")],
  outfile: join(out, "index.js"),
  tsconfig: join(root, "tsconfig.json"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node18",
  minify: true,
  loader: { ".txt": "text" },
  // Some bundled CommonJS deps call require(); give the ESM bundle one.
  banner: { js: "#!/usr/bin/env node\nimport { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
  logLevel: "warning",
});
copyFileSync(join(root, "public/wasm/slide_engine_bg.wasm"), join(out, "slide_engine_bg.wasm"));
chmodSync(join(out, "index.js"), 0o755);
console.log("md2slides-mcp built → packages/mcp/dist");
