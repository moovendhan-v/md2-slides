/* tslint:disable */
/* eslint-disable */
/**
 * Parse a deck. `resolve(path) => string | undefined` serves `<<<` imports.
 * Returns the deck model as a JSON string.
 */
export function parseDeck(src: string, resolve?: Function | null): string;
/**
 * Render a custom layout's HTML slots with JSON slide data.
 */
export function fillTemplate(html: string, data_json: string): string;
export function engineVersion(): string;
/**
 * Template registry exposed to JS. All payloads are JSON strings so the
 * boundary stays cheap and schema-checked on the Rust side.
 */
export class TemplateStore {
  free(): void;
  categories(source: string): string;
  /**
   * Restore from a binary snapshot produced by `snapshot()`.
   */
  static fromSnapshot(bytes: Uint8Array): TemplateStore;
  /**
   * JSON of one template, or an empty string when missing.
   */
  get(id: string): string;
  constructor();
  /**
   * `{source, category, q, page, per}` → `{items, total, page, pages}`.
   */
  query(filter_json: string): string;
  remove(id: string): boolean;
  upsert(json: string): void;
  snapshot(): Uint8Array;
  /**
   * Append a JSON array of templates (ids already present are replaced).
   */
  loadMany(json: string): number;
  readonly size: number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_templatestore_free: (a: number, b: number) => void;
  readonly engineVersion: (a: number) => void;
  readonly fillTemplate: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly parseDeck: (a: number, b: number, c: number, d: number) => void;
  readonly templatestore_categories: (a: number, b: number, c: number, d: number) => void;
  readonly templatestore_fromSnapshot: (a: number, b: number, c: number) => void;
  readonly templatestore_get: (a: number, b: number, c: number, d: number) => void;
  readonly templatestore_loadMany: (a: number, b: number, c: number, d: number) => void;
  readonly templatestore_new: () => number;
  readonly templatestore_query: (a: number, b: number, c: number, d: number) => void;
  readonly templatestore_remove: (a: number, b: number, c: number) => number;
  readonly templatestore_size: (a: number) => number;
  readonly templatestore_snapshot: (a: number, b: number) => void;
  readonly templatestore_upsert: (a: number, b: number, c: number, d: number) => void;
  readonly __wbindgen_export_0: (a: number) => void;
  readonly __wbindgen_export_1: (a: number, b: number) => number;
  readonly __wbindgen_export_2: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_export_3: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
