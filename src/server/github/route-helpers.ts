import "server-only";
import { NextResponse } from "next/server";
import { notify } from "@/server/notify";
import { clearSession, getSession, type Session } from "@/server/session";
import { GitHubClient, GitHubError } from "./client";

/** Valid `owner/name` repository id. */
export const REPO_RE = /^[\w.-]+\/[\w.-]+$/;

export const bad = (msg: string, status = 400) => new NextResponse(msg, { status, headers: { "cache-control": "no-store" } });

/**
 * Wraps a GitHub-backed route: requires a session, builds a client, and maps
 * GitHub errors (expired token → 401 + sign-out, rate limit → 429).
 */
export async function withGitHub(fn: (gh: GitHubClient, s: Session) => Promise<Response>): Promise<Response> {
  const session = await getSession();
  if (!session) return bad("Not signed in", 401);
  try {
    return await fn(new GitHubClient(session.token), session);
  } catch (e) {
    if (e instanceof GitHubError) {
      if (e.status === 401) {
        await clearSession();
        return bad("GitHub session expired — sign in again", 401);
      }
      if (e.status === 403 || e.status === 429) {
        notify("warn", "GitHub rate limit / permission error", { status: e.status, user: session.login });
        return bad(e.message, e.status === 403 && /rate limit/i.test(e.message) ? 429 : e.status);
      }
      return bad(e.message, e.status >= 500 ? 502 : e.status);
    }
    notify("error", "GitHub route failed", { user: session.login, error: (e as Error).message });
    return bad("GitHub request failed", 502);
  }
}
