"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { buildTree, fileIcon, isMarkdown, type TreeNode } from "@/domain/workspace/tree";
import { Icon } from "@/components/common/icon";
import { useFileActions } from "@/hooks/use-file-actions";
import { useRepoTree } from "@/hooks/use-queries";
import { useSelectedRepos } from "@/hooks/use-selected-repos";
import type { Repo } from "@/services/git/types";
import { cn } from "@/lib/utils";
import { useUi } from "@/stores/ui";
import { fileKey, selectChanged, useWorkspace } from "@/stores/workspace";

function Row({ depth, active, dirty, onClick, title, children }: { depth: number; active?: boolean; dirty?: boolean; onClick: () => void; title?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{ paddingLeft: 8 + depth * 14 }}
      className={cn("flex h-7 w-full items-center gap-1.5 rounded-md pr-2 text-left text-[13px] hover:bg-zinc-900", active && "bg-slate-800/80 hover:bg-slate-800")}
    >
      {children}
      {dirty && <span className="ml-auto size-1.5 shrink-0 rounded-full bg-amber-400" title="Modified" />}
    </button>
  );
}

function Nodes({ repo, nodes, depth, changed }: { repo: string; nodes: TreeNode[]; depth: number; changed: string[] }) {
  const expanded = useWorkspace((s) => s.expanded);
  const toggle = useWorkspace((s) => s.toggleExpanded);
  const activeKey = useWorkspace((s) => s.activeKey);
  const view = useUi((s) => s.view);
  const { openFile } = useFileActions();
  return (
    <>
      {nodes.map((n) => {
        const key = fileKey(repo, n.path);
        if (n.kind === "folder") {
          const open = !!expanded[key];
          return (
            <div key={key}>
              <Row depth={depth} onClick={() => toggle(key)} dirty={changed.some((c) => c.startsWith(key + "/"))} title={n.path}>
                <Icon name={open ? "caret-down" : "caret-right"} className="text-[11px] text-zinc-500" />
                <Icon name={open ? "folder-open" : "folder"} className="text-zinc-400" />
                <span className="truncate text-zinc-300">{n.name}</span>
              </Row>
              {open && <Nodes repo={repo} nodes={n.children} depth={depth + 1} changed={changed} />}
            </div>
          );
        }
        const md = isMarkdown(n.name);
        const active = view === "editor" && activeKey === key;
        return (
          <Row
            key={key}
            depth={depth + 1}
            active={active}
            dirty={changed.includes(key)}
            title={md ? `Open ${n.path}` : `${n.path} — not a Markdown file`}
            onClick={() => (md ? void openFile(key) : toast(`${n.name} is not a Markdown file — only .md opens as slides`))}
          >
            <Icon name={fileIcon(n.name)} className={md ? "text-blue-400" : "text-zinc-600"} />
            <span className={cn("truncate", md ? (active ? "font-medium text-zinc-50" : "text-zinc-300") : "text-zinc-500")}>{n.name}</span>
          </Row>
        );
      })}
    </>
  );
}

function RepoRow({ repo, changed }: { repo: Repo; changed: string[] }) {
  const open = useWorkspace((s) => !!s.expanded[repo.id]);
  const paths = useWorkspace((s) => s.paths[repo.id]);
  const toggle = useWorkspace((s) => s.toggleExpanded);
  const { view, repoView, setView } = useUi();
  const tree = useRepoTree(repo, open);
  // Decks only: Markdown files, and just the folders that contain them.
  const nodes = useMemo(() => buildTree((paths ?? []).filter(isMarkdown)), [paths]);
  const act = view === "repo" && repoView === repo.id;
  return (
    <div>
      <Row
        depth={0}
        active={act}
        dirty={changed.some((k) => k.startsWith(repo.id + "::"))}
        title={repo.id}
        onClick={() => {
          toggle(repo.id, !open || act);
          setView("repo", repo.id);
        }}
      >
        <Icon name={open ? "caret-down" : "caret-right"} className="text-[11px] text-zinc-500" />
        <Icon name="github-logo" className="text-zinc-400" />
        <span className="truncate font-semibold text-zinc-50">{repo.id.split("/")[1]}</span>
        {repo.private && <Icon name="lock-simple" className="ml-auto text-[11px] text-zinc-600" />}
      </Row>
      {open && tree.isPending && <p className="py-1 pl-8 text-xs text-zinc-500">Loading files…</p>}
      {open && tree.isError && <p className="py-1 pl-8 text-xs text-red-400">{tree.error.message}</p>}
      {open && tree.isSuccess && !nodes.length && <p className="py-1 pl-8 text-xs text-zinc-500">No Markdown files</p>}
      {open && <Nodes repo={repo.id} nodes={nodes} depth={0} changed={changed} />}
    </div>
  );
}

export function FileTree() {
  const { repos, hasChosen } = useSelectedRepos();
  const files = useWorkspace((s) => s.files);
  const orig = useWorkspace((s) => s.orig);
  const changed = useMemo(() => selectChanged({ files, orig }), [files, orig]);
  const all = useWorkspace((s) => s.repos.length);
  if (!all) return <p className="px-3 py-2 text-xs text-zinc-500">No repositories found on your GitHub account.</p>;
  if (!hasChosen)
    return (
      <button type="button" onClick={() => useUi.getState().openModal("repos")} className="mx-1 mt-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-md border border-dashed border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:border-zinc-500">
        <Icon name="plus" /> Choose repositories
      </button>
    );
  return (
    <div className="flex flex-col gap-0.5">
      {repos.map((r) => (
        <RepoRow key={r.id} repo={r} changed={changed} />
      ))}
    </div>
  );
}
