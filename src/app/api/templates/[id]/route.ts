import { NextResponse } from "next/server";
import { serverTemplateStore } from "@/server/template-store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const t = serverTemplateStore().get((await params).id);
  return t ? NextResponse.json(t) : new NextResponse("Not found", { status: 404 });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const ok = serverTemplateStore().remove((await params).id);
  return new NextResponse(null, { status: ok ? 204 : 404 });
}
