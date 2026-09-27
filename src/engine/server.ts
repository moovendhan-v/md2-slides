import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { SlideEngine } from "./engine";
import { loadNodeEngine } from "./node";

/**
 * Instantiate the engine inside server runtimes (Cloudflare Workers / Node.js) — the binary is read
 * from disk once per instance and reused across invocations.
 * `outputFileTracingIncludes` in next.config.ts ships the file with the function bundle.
 */
export function getServerEngine(): SlideEngine {
  return loadNodeEngine(() => fs.readFileSync(path.join(process.cwd(), "public", "wasm", "slide_engine_bg.wasm")));
}
