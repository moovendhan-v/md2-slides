import "server-only";
import type { TemplateStoreApi } from "@/engine/engine";
import { getServerEngine } from "@/engine/server";
import { builtinTemplates } from "@/services/templates/seed";

let store: TemplateStoreApi | null = null;

/**
 * Per-instance Wasm template store, seeded with the built-in catalog.
 * Writes live as long as the function instance; plug a durable adapter
 * (Cloudflare KV / R2 storing `store.snapshot()` bytes) here for persistence.
 */
export function serverTemplateStore(): TemplateStoreApi {
  if (!store) {
    store = getServerEngine().createStore();
    store.loadMany(builtinTemplates());
  }
  return store;
}
