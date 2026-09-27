import "server-only";

/** Error carrying GitHub's HTTP status so routes can map it (401 → sign out, 403/429 → rate limit). */
export class GitHubError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface GhRepo {
  full_name: string;
  private: boolean;
  default_branch: string;
  pushed_at: string;
  permissions?: { push?: boolean };
}

export interface GhUser {
  login: string;
  name: string | null;
  avatar_url: string;
}

export interface FileChange {
  path: string;
  content: string;
}

const API = "https://api.github.com";

/** Minimal GitHub REST client bound to one user's OAuth token. */
export class GitHubClient {
  constructor(private token: string) {}

  private async req<T>(path: string, init: RequestInit & { raw?: boolean } = {}): Promise<T> {
    const res = await fetch(API + path, {
      ...init,
      headers: {
        authorization: `Bearer ${this.token}`,
        accept: init.raw ? "application/vnd.github.raw+json" : "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        "user-agent": "md2slides",
        ...(init.body ? { "content-type": "application/json" } : {}),
      },
      cache: "no-store",
    });
    if (!res.ok) {
      const msg = await res.json().then((j: { message?: string }) => j.message, () => res.statusText);
      throw new GitHubError(res.status, msg || `GitHub ${res.status}`);
    }
    return (init.raw ? res.text() : res.json()) as Promise<T>;
  }

  user() {
    return this.req<GhUser>("/user");
  }

  /** Repos the user owns, collaborates on or can see through orgs — most recently pushed first. */
  repos() {
    return this.req<GhRepo[]>("/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator,organization_member");
  }

  /** All file paths on a branch (recursive tree). */
  async paths(repo: string, branch: string) {
    const t = await this.req<{ tree: { path: string; type: string }[]; truncated: boolean }>(`/repos/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
    return { paths: t.tree.filter((n) => n.type === "blob").map((n) => n.path), truncated: t.truncated };
  }

  file(repo: string, path: string, ref: string) {
    const p = path.split("/").map(encodeURIComponent).join("/");
    return this.req<string>(`/repos/${repo}/contents/${p}?ref=${encodeURIComponent(ref)}`, { raw: true });
  }

  /** Fetch file metadata and content (handles base64 binary files). */
  async fileContent(repo: string, path: string, ref: string): Promise<{ content: string; encoding?: string }> {
    const p = path.split("/").map(encodeURIComponent).join("/");
    const res = await this.req<{ content?: string; encoding?: string }>(`/repos/${repo}/contents/${p}?ref=${encodeURIComponent(ref)}`);
    return { content: res.content ?? "", encoding: res.encoding };
  }

  /** One commit containing every change, via the Git Data API. */
  async commit(repo: string, branch: string, message: string, changes: FileChange[]) {
    const ref = await this.req<{ object: { sha: string } }>(`/repos/${repo}/git/ref/heads/${encodeURIComponent(branch)}`);
    const parent = ref.object.sha;
    const base = await this.req<{ tree: { sha: string } }>(`/repos/${repo}/git/commits/${parent}`);
    const blobs = await Promise.all(
      changes.map((c) => {
        const m = c.content.match(/^data:[^;]+;base64,([\s\S]*)$/);
        if (m) {
          return this.req<{ sha: string }>(`/repos/${repo}/git/blobs`, { method: "POST", body: JSON.stringify({ content: m[1].replace(/\s+/g, ""), encoding: "base64" }) });
        }
        return this.req<{ sha: string }>(`/repos/${repo}/git/blobs`, { method: "POST", body: JSON.stringify({ content: c.content, encoding: "utf-8" }) });
      }),
    );
    const tree = await this.req<{ sha: string }>(`/repos/${repo}/git/trees`, {
      method: "POST",
      body: JSON.stringify({ base_tree: base.tree.sha, tree: changes.map((c, i) => ({ path: c.path, mode: "100644", type: "blob", sha: blobs[i].sha })) }),
    });
    const commit = await this.req<{ sha: string; html_url: string }>(`/repos/${repo}/git/commits`, { method: "POST", body: JSON.stringify({ message, tree: tree.sha, parents: [parent] }) });
    await this.req(`/repos/${repo}/git/refs/heads/${encodeURIComponent(branch)}`, { method: "PATCH", body: JSON.stringify({ sha: commit.sha }) });
    return commit;
  }

  /** Commit onto a new branch and open a pull request against `base`. */
  async pullRequest(repo: string, base: string, message: string, changes: FileChange[]) {
    const head = `md2slides/${Date.now().toString(36)}`;
    const ref = await this.req<{ object: { sha: string } }>(`/repos/${repo}/git/ref/heads/${encodeURIComponent(base)}`);
    await this.req(`/repos/${repo}/git/refs`, { method: "POST", body: JSON.stringify({ ref: `refs/heads/${head}`, sha: ref.object.sha }) });
    const commit = await this.commit(repo, head, message, changes);
    const pr = await this.req<{ number: number; html_url: string }>(`/repos/${repo}/pulls`, {
      method: "POST",
      body: JSON.stringify({ title: message, head, base, body: "Opened from md2slides." }),
    });
    return { sha: commit.sha, url: pr.html_url, pullRequest: pr.number };
  }
}
