import { NextResponse } from "next/server";
import { bad, REPO_RE, withGitHub } from "@/server/github/route-helpers";

export const runtime = "nodejs";

/** GET ?repo=owner/name → string[] of branch names */
export function GET(req: Request) {
  const u = new URL(req.url).searchParams;
  const repo = u.get("repo") ?? "";
  if (!REPO_RE.test(repo)) return Promise.resolve(bad("repo is required"));
  return withGitHub(async (gh) => NextResponse.json(await gh.branches(repo), { headers: { "cache-control": "no-store" } }));
}
