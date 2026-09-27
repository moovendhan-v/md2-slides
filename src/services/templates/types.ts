import type { TemplateFilter, TemplatePage, TemplateRecord, TemplateSource } from "@/engine/types";

/**
 * Where templates live. Implementations: the in-browser Wasm store
 * (IndexedDB-persisted) and the HTTP client for the Wasm-backed server API.
 */
export interface TemplateRepository {
  query(filter: TemplateFilter): Promise<TemplatePage>;
  get(id: string): Promise<TemplateRecord | undefined>;
  save(t: TemplateRecord): Promise<TemplateRecord>;
  remove(id: string): Promise<boolean>;
  categories(source: TemplateSource): Promise<string[]>;
}
