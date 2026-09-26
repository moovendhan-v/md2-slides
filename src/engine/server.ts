import "server-only";
import fs from "node:fs";
import path from "node:path";
import * as bindings from "./wasm/pkg/slide_engine";
import { createEngine, type SlideEngine } from "./engine";

let engine: SlideEngine | null = null;

/**
 * Instantiate the engine inside a Vercel Function (Node.js runtime), as in
 * https://vercel.com/docs/functions/runtimes/wasm — the binary is read from
 * disk once per instance and reused across invocations (Fluid compute).
 * `outputFileTracingIncludes` in next.config.ts ships the file with the function.
 */
export function getServerEngine(): SlideEngine {
  if (!engine) {
    const file = path.join(process.cwd(), "public", "wasm", "slide_engine_bg.wasm");
    bindings.initSync({ module: fs.readFileSync(file) });
    engine = createEngine(bindings);
  }
  return engine;
}
