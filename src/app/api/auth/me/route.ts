import { NextResponse } from "next/server";
import { env } from "@/server/env";
import { getSession } from "@/server/session";

export const runtime = "nodejs";

/** Current user (never includes the token). */
export async function GET() {
  const s = await getSession();
  const headers = { "cache-control": "no-store" };
  if (!s) return NextResponse.json({ user: null }, { headers });
  return NextResponse.json(
    { user: { login: s.login, name: s.name, avatar: s.avatar, scope: s.scope, since: s.since }, manageUrl: `https://github.com/settings/connections/applications/${env.githubClientId()}` },
    { headers },
  );
}
