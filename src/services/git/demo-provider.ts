import { SEED_REPOS, type RepoNode } from "@/data";
import type { CommitRequest, CommitResult, GitProvider, Repo, RepoFile } from "./types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function flatten(nodes: RepoNode[], prefix = ""): RepoFile[] {
  return nodes.flatMap((n) => {
    const path = prefix ? `${prefix}/${n.name}` : n.name;
    return n.children ? flatten(n.children, path) : [{ path, content: n.content }];
  });
}

/**
 * In-browser demo backend seeded from `src/data/repos.json`. Swap for a
 * GitHub REST implementation of `GitProvider` without touching the UI.
 */
export class DemoGitProvider implements GitProvider {
  constructor(private latency = 250) {}

  async listRepos(): Promise<Repo[]> {
    await delay(this.latency);
    return SEED_REPOS.map((r) => ({ id: r.id, private: r.private, branch: r.branch, updated: r.updated, files: flatten(r.tree) }));
  }

  async commit(req: CommitRequest): Promise<CommitResult> {
    await delay(this.latency * 2);
    const sha = Math.random().toString(16).slice(2, 9);
    return req.asPullRequest
      ? { sha, url: `https://github.com/${req.repo}/pull/${100 + req.changes.length}`, pullRequest: 100 + req.changes.length }
      : { sha, url: `https://github.com/${req.repo}/commit/${sha}` };
  }
}
