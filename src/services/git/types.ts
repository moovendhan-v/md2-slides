/** Git hosting abstraction. The UI depends only on this interface. */

export interface RepoFile {
  path: string;
  /** Text content (undefined for binary / non-loaded files). */
  content?: string;
}

export interface Repo {
  id: string;
  private: boolean;
  branch: string;
  updated: string;
  files: RepoFile[];
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
  /** Open a pull request instead of pushing to the branch. */
  asPullRequest?: boolean;
}

export interface CommitResult {
  sha: string;
  url: string;
  pullRequest?: number;
}

export interface GitProvider {
  listRepos(): Promise<Repo[]>;
  commit(req: CommitRequest): Promise<CommitResult>;
}
