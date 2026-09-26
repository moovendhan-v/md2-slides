import type { TemplateFilter, TemplatePage, TemplateRecord, TemplateSource } from "@/engine/types";
import type { TemplateRepository } from "./types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error((await res.text()) || res.statusText);
  return res.json() as Promise<T>;
}

/** Talks to `/api/templates`, which runs the same Wasm store on Vercel. */
export class HttpTemplateRepository implements TemplateRepository {
  constructor(private base = "/api/templates") {}

  query(f: TemplateFilter) {
    const q = new URLSearchParams(Object.entries(f).filter(([, v]) => v != null && v !== "").map(([k, v]) => [k, String(v)]));
    return fetch(`${this.base}?${q}`).then((r) => json<TemplatePage>(r));
  }

  get(id: string) {
    return fetch(`${this.base}/${encodeURIComponent(id)}`).then((r) => (r.status === 404 ? undefined : json<TemplateRecord>(r)));
  }

  save(t: TemplateRecord) {
    return fetch(this.base, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(t) }).then((r) => json<TemplateRecord>(r));
  }

  remove(id: string) {
    return fetch(`${this.base}/${encodeURIComponent(id)}`, { method: "DELETE" }).then((r) => r.ok);
  }

  categories(source: TemplateSource) {
    return fetch(`${this.base}?categories=${source}`).then((r) => json<string[]>(r));
  }
}
