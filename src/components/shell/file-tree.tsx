"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { buildTree, fileIcon, isMarkdown, type TreeNode } from "@/domain/workspace/tree";
import { Icon } from "@/components/common/icon";
import { useFileActions } from "@/hooks/use-file-actions";
import { cn } from "@/lib/utils";
import { pref, useSession } from "@/stores/session";
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
            onClick={() => (md ? openFile(key) : toast(`${n.name} is not a Markdown file — only .md opens as slides`))}
          >
            <Icon name={fileIcon(n.name)} className={md ? "text-blue-400" : "text-zinc-600"} />
            <span className={cn("truncate", md ? (active ? "font-medium text-zinc-50" : "text-zinc-300") : "text-zinc-500")}>{n.name}</span>
          </Row>
        );
      })}
    </>
  );
}

export function FileTree() {
  const repos = useWorkspace((s) => s.repos);
  const paths = useWorkspace((s) => s.paths);
  const expanded = useWorkspace((s) => s.expanded);
  const toggle = useWorkspace((s) => s.toggleExpanded);
  const files = useWorkspace((s) => s.files);
  const orig = useWorkspace((s) => s.orig);
  const changed = useMemo(() => selectChanged({ files, orig }), [files, orig]);
  const prefs = useSession((s) => s.prefs);
  const { view, repoView, setView } = useUi();
  const trees = useMemo(() => Object.fromEntries(Object.entries(paths).map(([r, p]) => [r, buildTree(p)])), [paths]);
  return (
    <div className="flex flex-col gap-0.5">
      {repos
        .filter((r) => pref(prefs, "repo:" + r.id, true))
        .map((r) => {
          const open = !!expanded[r.id];
          const act = view === "repo" && repoView === r.id;
          return (
            <div key={r.id}>
              <Row
                depth={0}
                active={act}
                dirty={changed.some((k) => k.startsWith(r.id + "::"))}
                title={r.id}
                onClick={() => {
                  toggle(r.id, !open || act);
                  setView("repo", r.id);
                }}
              >
                <Icon name={open ? "caret-down" : "caret-right"} className="text-[11px] text-zinc-500" />
                <Icon name="github-logo" className="text-zinc-400" />
                <span className="truncate font-semibold text-zinc-50">{r.id.split("/")[1]}</span>
                {r.private && <Icon name="lock-simple" className="ml-auto text-[11px] text-zinc-600" />}
              </Row>
              {open && <Nodes repo={r.id} nodes={trees[r.id] ?? []} depth={0} changed={changed} />}
            </div>
          );
        })}
    </div>
  );
}
