import { create } from "zustand";
import type { Repo } from "@/services/git/types";

/** Files are addressed as `${repoId}::${path}`. */
export const fileKey = (repo: string, path: string) => `${repo}::${path}`;
export const splitKey = (key: string) => {
  const [repo = "", path = ""] = key.split("::");
  return { repo, path };
};

/**
 * Local working copy of the user's repositories. Everything is loaded lazily
 * from GitHub: the repo list at sign-in, a repo's file tree when it is
 * expanded, and a file's content when it is opened.
 */
interface WorkspaceState {
  repos: Repo[];
  /** Working copy and last pushed content per loaded file. */
  files: Record<string, string>;
  orig: Record<string, string>;
  /** All file paths per repo, once its tree has been fetched. */
  paths: Record<string, string[]>;
  activeKey: string;
  expanded: Record<string, boolean>;
  setRepos: (repos: Repo[]) => void;
  setPaths: (repo: string, paths: string[]) => void;
  /** Add fetched content (never overwrites local edits). */
  loadFile: (key: string, content: string) => void;
  setSource: (value: string) => void;
  updateSource: (fn: (src: string) => string) => void;
  openFile: (key: string) => void;
  createFile: (repo: string, path: string, content: string) => string;
  markPushed: (keys: string[]) => void;
  toggleExpanded: (id: string, value?: boolean) => void;
}

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  repos: [],
  files: {},
  orig: {},
  paths: {},
  activeKey: "",
  expanded: {},
  setRepos: (repos) => set({ repos }),
  setPaths: (repo, paths) =>
    set((s) => {
      // Keep locally created files that are not on GitHub yet.
      const local = (s.paths[repo] ?? []).filter((p) => !paths.includes(p) && s.orig[fileKey(repo, p)] == null && s.files[fileKey(repo, p)] != null);
      return { paths: { ...s.paths, [repo]: [...paths, ...local] } };
    }),
  loadFile: (key, content) =>
    set((s) => (s.files[key] != null ? s : { files: { ...s.files, [key]: content }, orig: { ...s.orig, [key]: content } })),
  setSource: (value) => set((s) => (s.activeKey ? { files: { ...s.files, [s.activeKey]: value } } : s)),
  updateSource: (fn) => set((s) => (s.activeKey ? { files: { ...s.files, [s.activeKey]: fn(s.files[s.activeKey] ?? "") } } : s)),
  openFile: (key) => set({ activeKey: key }),
  createFile: (repo, base, content) => {
    const s = get();
    const stem = base.replace(/\.md$/, "");
    const taken = (p: string) => s.files[fileKey(repo, p)] != null || (s.paths[repo] ?? []).includes(p);
    let path = `${stem}.md`;
    for (let n = 2; taken(path); n++) path = `${stem}-${n}.md`;
    const key = fileKey(repo, path);
    const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
    set({
      files: { ...s.files, [key]: content },
      paths: { ...s.paths, [repo]: [...(s.paths[repo] ?? []), path] },
      expanded: { ...s.expanded, [repo]: true, ...(dir ? { [fileKey(repo, dir)]: true } : {}) },
      activeKey: key,
    });
    return key;
  },
  markPushed: (keys) => set((s) => ({ orig: { ...s.orig, ...Object.fromEntries(keys.map((k) => [k, s.files[k]])) } })),
  toggleExpanded: (id, value) => set((s) => ({ expanded: { ...s.expanded, [id]: value ?? !s.expanded[id] } })),
}));

/** Keys whose working copy differs from the pushed version (including new files). */
export const selectChanged = (s: Pick<WorkspaceState, "files" | "orig">) => Object.keys(s.files).filter((k) => s.files[k] !== s.orig[k]);

export const useActiveSource = () => useWorkspace((s) => s.files[s.activeKey] ?? "");
