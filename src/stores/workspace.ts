import { create } from "zustand";
import type { Repo } from "@/services/git/types";

/** Files are addressed as `${repoId}::${path}`. */
export const fileKey = (repo: string, path: string) => `${repo}::${path}`;
export const splitKey = (key: string) => {
  const [repo, path = ""] = key.split("::");
  return { repo, path };
};

interface WorkspaceState {
  ready: boolean;
  repos: Repo[];
  /** Working copy and last pushed content per file. */
  files: Record<string, string>;
  orig: Record<string, string>;
  /** All paths per repo (including non-Markdown assets). */
  paths: Record<string, string[]>;
  activeKey: string;
  expanded: Record<string, boolean>;
  hydrate: (repos: Repo[], initialKey: string) => void;
  setSource: (value: string) => void;
  updateSource: (fn: (src: string) => string) => void;
  openFile: (key: string) => void;
  createFile: (repo: string, path: string, content: string) => string;
  markPushed: (keys: string[]) => void;
  toggleExpanded: (id: string, value?: boolean) => void;
}

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  ready: false,
  repos: [],
  files: {},
  orig: {},
  paths: {},
  activeKey: "",
  expanded: {},
  hydrate: (repos, initialKey) => {
    if (get().ready) return;
    const files: Record<string, string> = {};
    const paths: Record<string, string[]> = {};
    repos.forEach((r) => {
      paths[r.id] = r.files.map((f) => f.path);
      r.files.forEach((f) => f.content != null && (files[fileKey(r.id, f.path)] = f.content));
    });
    const { repo, path } = splitKey(initialKey);
    const dir = path.includes("/") ? path.slice(0, path.indexOf("/")) : "";
    set({ ready: true, repos, files, orig: { ...files }, paths, activeKey: initialKey, expanded: { [repo]: true, ...(dir ? { [fileKey(repo, dir)]: true } : {}) } });
  },
  setSource: (value) => set((s) => ({ files: { ...s.files, [s.activeKey]: value } })),
  updateSource: (fn) => set((s) => ({ files: { ...s.files, [s.activeKey]: fn(s.files[s.activeKey] ?? "") } })),
  openFile: (key) => set({ activeKey: key }),
  createFile: (repo, base, content) => {
    const s = get();
    const stem = base.replace(/\.md$/, "");
    let path = `${stem}.md`;
    for (let n = 2; s.files[fileKey(repo, path)] != null; n++) path = `${stem}-${n}.md`;
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

/** Keys whose working copy differs from the pushed version. */
export const selectChanged = (s: Pick<WorkspaceState, "files" | "orig">) => Object.keys(s.files).filter((k) => s.files[k] !== s.orig[k]);

export const useActiveSource = () => useWorkspace((s) => s.files[s.activeKey] ?? "");
