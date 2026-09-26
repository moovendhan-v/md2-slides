import { NextResponse } from "next/server";
import type { TemplateRecord, TemplateSource } from "@/engine/types";
import { serverTemplateStore } from "@/server/template-store";

export const runtime = "nodejs";

/** GET ?source&category&q&page&per — paged search in the Wasm store; ?categories=<source> lists categories. */
export function GET(req: Request) {
  const u = new URL(req.url).searchParams;
  const store = serverTemplateStore();
  const cats = u.get("categories");
  if (cats) return NextResponse.json(store.categories(cats as TemplateSource));
  return NextResponse.json(
    store.query({
      source: (u.get("source") as TemplateSource) || "all",
      category: u.get("category") || undefined,
      q: u.get("q") || undefined,
      page: Number(u.get("page") || 0),
      per: Number(u.get("per") || 0),
    }),
  );
}

/** POST a template record; validated by the Rust store (serde) before insert. */
export async function POST(req: Request) {
  try {
    const t = (await req.json()) as TemplateRecord;
    serverTemplateStore().upsert(t);
    return NextResponse.json(t, { status: 201 });
  } catch (e) {
    return new NextResponse((e as Error).message, { status: 400 });
  }
}
