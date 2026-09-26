/** Git hosting abstraction. The UI depends only on these interfaces. */

export interface User {
  login: string;
  name: string;
  avatar: string;
  scope: string;
  since: number;
}

export interface Me {
  user: User | null;
  manageUrl?: string;
}

export interface Repo {
  id: string;
  private: boolean;
  branch: string;
  pushedAt: string;
  canPush: boolean;
}

export interface RepoTree {
  paths: string[];
  truncated: boolean;
}

export interface FileChange {
  path: string;
  content: string;
}

export interface CommitRequest {
  repo: string;
  branch: string;
  message: string;
  changes: FileChange[];
  /** Commit to a new branch and open a pull request instead of pushing. */
  asPullRequest?: boolean;
}

export interface CommitResult {
  sha: string;
  url: string;
  pullRequest?: number;
}

export interface AuthProvider {
  me(): Promise<Me>;
  signIn(): void;
  signOut(): Promise<void>;
}

export interface GitProvider {
  listRepos(): Promise<Repo[]>;
  listPaths(repo: string, branch: string): Promise<RepoTree>;
  readFile(repo: string, path: string, ref: string): Promise<string>;
  commit(req: CommitRequest): Promise<CommitResult>;
}
