import { NextResponse } from "next/server";
import { env } from "@/server/env";
import { issueState } from "@/server/session";

export const runtime = "nodejs";

/** Start the GitHub OAuth flow. `repo` scope is needed to read and push private decks. */
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const q = new URLSearchParams({
    client_id: env.githubClientId(),
    redirect_uri: `${origin}/api/auth/github/callback`,
    scope: "repo read:user",
    state: await issueState(),
    allow_signup: "true",
  });
  return NextResponse.redirect(`https://github.com/login/oauth/authorize?${q}`);
}
