import { NextResponse } from "next/server";
import { env } from "@/server/env";
import { GitHubClient } from "@/server/github/client";
import { notify } from "@/server/notify";
import { consumeState, setSession } from "@/server/session";

export const runtime = "nodejs";

/** Exchange the OAuth code for a token (server-side, secret never leaves the server). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  // Back to the editor (the landing page lives at `/`).
  const home = (err?: string) => NextResponse.redirect(new URL(err ? `/app?auth_error=${encodeURIComponent(err)}` : "/app", url.origin));
  if (url.searchParams.get("error")) return home(url.searchParams.get("error_description") || "Authorization was cancelled");
  if (!(await consumeState(url.searchParams.get("state")))) return home("Sign-in expired or was tampered with — try again");
  const code = url.searchParams.get("code");
  if (!code) return home("Missing authorization code");

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ client_id: env.githubClientId(), client_secret: env.githubClientSecret(), code, redirect_uri: `${url.origin}/api/auth/github/callback` }),
  });
  const tok = (await res.json().catch(() => ({}))) as { access_token?: string; scope?: string; error_description?: string };
  if (!tok.access_token) {
    notify("error", "GitHub OAuth token exchange failed", { reason: tok.error_description || res.statusText });
    return home(tok.error_description || "GitHub sign-in failed");
  }
  const user = await new GitHubClient(tok.access_token).user();
  await setSession({ token: tok.access_token, login: user.login, name: user.name || user.login, avatar: user.avatar_url, scope: tok.scope || "", since: Date.now() });
  notify("info", "User signed in", { user: user.login });
  return home();
}
