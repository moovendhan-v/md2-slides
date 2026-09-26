/** Load the Wasm slide engine in plain Node scripts (build-time validation). */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { initSync, parseDeck } from "../src/engine/wasm/pkg/slide_engine.js";
import { root } from "./ui-bundle.mjs";

let ready = false;

/** Parse deck Markdown → { meta, slides, problems }. */
export function parse(md) {
  if (!ready) {
    initSync({ module: readFileSync(join(root, "public/wasm/slide_engine_bg.wasm")) });
    ready = true;
  }
  return JSON.parse(parseDeck(md, null));
}
