import { NextResponse } from "next/server";
import { withGitHub } from "@/server/github/route-helpers";

export const runtime = "nodejs";

export function GET() {
  return withGitHub(async (gh) => {
    const repos = await gh.repos();
    return NextResponse.json(
      repos.map((r) => ({ id: r.full_name, private: r.private, branch: r.default_branch, pushedAt: r.pushed_at, canPush: !!r.permissions?.push })),
      { headers: { "cache-control": "no-store" } },
    );
  });
}
