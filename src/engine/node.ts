import * as bindings from "./wasm/pkg/slide_engine";
import { createEngine, type SlideEngine } from "./engine";

let engine: SlideEngine | null = null;

/**
 * Instantiate the Wasm engine in Node from the binary's bytes (read once per
 * process). Shared by the Next.js API routes and the md2slides MCP server.
 */
export function loadNodeEngine(wasm: () => Uint8Array): SlideEngine {
  if (!engine) {
    bindings.initSync({ module: wasm() });
    engine = createEngine(bindings);
  }
  return engine;
}
