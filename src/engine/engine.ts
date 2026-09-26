import type * as Bindings from "./wasm/pkg/slide_engine";
import type { Deck, FileResolver, TemplateFilter, TemplatePage, TemplateRecord } from "./types";

/**
 * Typed facade over the raw wasm-bindgen exports. Browser and server loaders
 * both hand their initialised bindings to `createEngine`, so every caller
 * works against this interface and never touches JSON strings or pointers.
 */
export interface TemplateStoreApi {
  readonly size: number;
  loadMany(list: TemplateRecord[]): number;
  upsert(t: TemplateRecord): void;
  remove(id: string): boolean;
  get(id: string): TemplateRecord | undefined;
  query(f: TemplateFilter): TemplatePage;
  categories(source: string): string[];
  snapshot(): Uint8Array;
}

export interface SlideEngine {
  version: string;
  parse(src: string, resolve?: FileResolver): Deck;
  fillTemplate(html: string, data: unknown): string;
  createStore(snapshot?: Uint8Array): TemplateStoreApi;
}

type Raw = Pick<typeof Bindings, "parseDeck" | "fillTemplate" | "engineVersion" | "TemplateStore">;

function wrapStore(raw: Bindings.TemplateStore): TemplateStoreApi {
  return {
    get size() {
      return raw.size;
    },
    loadMany: (list) => raw.loadMany(JSON.stringify(list)),
    upsert: (t) => raw.upsert(JSON.stringify(t)),
    remove: (id) => raw.remove(id),
    get: (id) => {
      const json = raw.get(id);
      return json ? (JSON.parse(json) as TemplateRecord) : undefined;
    },
    query: (f) => JSON.parse(raw.query(JSON.stringify({ page: 0, per: 0, ...f }))) as TemplatePage,
    categories: (source) => JSON.parse(raw.categories(source)) as string[],
    snapshot: () => raw.snapshot(),
  };
}

export function createEngine(b: Raw): SlideEngine {
  return {
    version: b.engineVersion(),
    parse: (src, resolve) => JSON.parse(b.parseDeck(src, resolve ?? null)) as Deck,
    fillTemplate: (html, data) => b.fillTemplate(html, JSON.stringify(data ?? {})),
    createStore: (snapshot) => wrapStore(snapshot ? b.TemplateStore.fromSnapshot(snapshot) : new b.TemplateStore()),
  };
}
