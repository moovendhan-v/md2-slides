import { bad, REPO_RE, withGitHub } from "@/server/github/route-helpers";

export const runtime = "nodejs";

/** GET ?repo&path&ref → raw text of one file. */
export function GET(req: Request) {
  const u = new URL(req.url).searchParams;
  const repo = u.get("repo") ?? "";
  const path = u.get("path") ?? "";
  const ref = u.get("ref") ?? "";
  if (!REPO_RE.test(repo) || !path || !ref || path.includes("..")) return Promise.resolve(bad("repo, path and ref are required"));
  return withGitHub(async (gh) => new Response(await gh.file(repo, path, ref), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } }));
}
