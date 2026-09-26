import { NextResponse } from "next/server";
import { getServerEngine } from "@/engine/server";

export const runtime = "nodejs";

/**
 * POST { src, files? } → deck model + problems. Lets CI, bots or other
 * services lint decks with exactly the parser the editor uses.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { src?: string; files?: Record<string, string> } | null;
  if (typeof body?.src !== "string") return new NextResponse("Body must be { src: string }", { status: 400 });
  const files = body.files ?? {};
  const deck = getServerEngine().parse(body.src, (p) => files[p]);
  return NextResponse.json(deck);
}
