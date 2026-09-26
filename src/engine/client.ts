"use client";

import { createEngine, type SlideEngine } from "./engine";

export const WASM_URL = "/wasm/slide_engine_bg.wasm";

let pending: Promise<SlideEngine> | null = null;

/** Load the engine once per tab; later calls share the same instance. */
export function loadEngine(): Promise<SlideEngine> {
  pending ??= import("./wasm/pkg/slide_engine").then(async (b) => {
    await b.default({ module_or_path: WASM_URL });
    return createEngine(b);
  });
  return pending;
}
