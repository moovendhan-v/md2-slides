import { del, get, set } from "idb-keyval";
import { migrateAsync } from "@/lib/storage";
import type { SlideEngine } from "@/engine/engine";
import { HttpTemplateRepository } from "./http-repository";
import type { TemplateRepository } from "./types";
import { WasmTemplateRepository, type SnapshotStorage } from "./wasm-repository";

export type { TemplateRepository } from "./types";

const KEY = "md2slides:templates:v1";
/** Snapshot key used before the rename. */
const LEGACY_KEY = "slidewise:templates:v1";

export const indexedDbStorage: SnapshotStorage = {
  load: () => migrateAsync<Uint8Array>(KEY, LEGACY_KEY, { get, set, del }),
  save: (bytes) => set(KEY, bytes),
};

/**
 * `NEXT_PUBLIC_TEMPLATE_SOURCE=remote` routes template reads/writes through the
 * Vercel Function; the default keeps everything local in the browser's Wasm store.
 */
export function createTemplateRepository(engine: SlideEngine): TemplateRepository {
  return process.env.NEXT_PUBLIC_TEMPLATE_SOURCE === "remote"
    ? new HttpTemplateRepository()
    : new WasmTemplateRepository(engine, typeof indexedDB === "undefined" ? undefined : indexedDbStorage);
}
