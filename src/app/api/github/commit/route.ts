import { NextResponse } from "next/server";
import { bad, REPO_RE, withGitHub } from "@/server/github/route-helpers";
import { notify } from "@/server/notify";

export const runtime = "nodejs";

interface Body {
  repo: string;
  branch: string;
  message: string;
  asPullRequest?: boolean;
  changes: { path: string; content: string }[];
}

/** POST one commit (or a PR) with every changed file of one repo. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as Body | null;
  if (!b || !REPO_RE.test(b.repo) || !b.branch || !b.message?.trim() || !Array.isArray(b.changes) || !b.changes.length) return bad("Invalid commit request");
  if (b.changes.some((c) => typeof c.path !== "string" || typeof c.content !== "string" || c.path.includes("..") || c.path.startsWith("/"))) return bad("Invalid file path");
  return withGitHub(async (gh, s) => {
    if (b.asPullRequest) return NextResponse.json(await gh.pullRequest(b.repo, b.branch, b.message.trim(), b.changes));
    const c = await gh.commit(b.repo, b.branch, b.message.trim(), b.changes);
    notify("info", "Deck pushed", { user: s.login, repo: b.repo, files: b.changes.length });
    return NextResponse.json({ sha: c.sha, url: c.html_url });
  });
}
