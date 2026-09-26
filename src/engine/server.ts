import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { SlideEngine } from "./engine";
import { loadNodeEngine } from "./node";

/**
 * Instantiate the engine inside a Vercel Function (Node.js runtime), as in
 * https://vercel.com/docs/functions/runtimes/wasm — the binary is read from
 * disk once per instance and reused across invocations (Fluid compute).
 * `outputFileTracingIncludes` in next.config.ts ships the file with the function.
 */
export function getServerEngine(): SlideEngine {
  return loadNodeEngine(() => fs.readFileSync(path.join(process.cwd(), "public", "wasm", "slide_engine_bg.wasm")));
}
