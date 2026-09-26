import { NextResponse } from "next/server";
import { bad, REPO_RE, withGitHub } from "@/server/github/route-helpers";

export const runtime = "nodejs";

/** GET ?repo=owner/name&branch=main → { paths, truncated } */
export function GET(req: Request) {
  const u = new URL(req.url).searchParams;
  const repo = u.get("repo") ?? "";
  const branch = u.get("branch") ?? "";
  if (!REPO_RE.test(repo) || !branch) return Promise.resolve(bad("repo and branch are required"));
  return withGitHub(async (gh) => NextResponse.json(await gh.paths(repo, branch), { headers: { "cache-control": "no-store" } }));
}
