"use client";

import { Icon } from "@/components/common/icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDeck } from "@/app-shell/deck-context";
import { cn } from "@/lib/utils";
import { useUi, type View } from "@/stores/ui";
import { useWorkspace } from "@/stores/workspace";
import { useTemplatesQuery } from "@/hooks/use-queries";
import { FileTree } from "./file-tree";

function NavItem({ label, icon, count, active, onClick }: { label: string; icon: string; count?: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors", active ? "bg-zinc-900 text-zinc-50" : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-100")}
    >
      <Icon name={icon} className="text-base" />
      <span className="flex-1 text-left">{label}</span>
      {count != null && <span className="text-[11px] text-zinc-500">{count}</span>}
    </button>
  );
}

export function AppSidebar() {
  const { view, setView, width, sidebarOpen, set } = useUi();
  const { repo } = useDeck();
  const repos = useWorkspace((s) => s.repos);
  const mdCount = useWorkspace((s) => Object.keys(s.files).filter((k) => k.endsWith(".md")).length);
  const templates = useTemplatesQuery({ source: "all", per: 1 });
  const overlay = width <= 760;
  if (!sidebarOpen) return null;
  const nav: [string, string, View, number?][] = [
    ["Editor", "note-pencil", "editor"],
    ["Template studio", "code-block", "studio"],
    ["Templates", "squares-four", "templates", templates.data?.total],
  ];
  const branch = repos.find((r) => r.id === repo)?.branch ?? "main";
  return (
    <>
      {overlay && <div className="fixed inset-x-0 top-[52px] bottom-0 z-30 bg-black/50" onClick={() => set({ sidebarOpen: false })} />}
      <aside className={cn("flex w-[260px] shrink-0 flex-col border-r border-zinc-800 bg-zinc-950", overlay && "fixed top-[52px] bottom-0 left-0 z-40 shadow-2xl")}>
        <nav className="flex flex-col gap-0.5 p-2.5">
          {nav.map(([label, icon, v, count]) => (
            <NavItem key={v} label={label} icon={icon} count={count} active={view === v} onClick={() => setView(v)} />
          ))}
          <NavItem label="All decks" icon="files" count={mdCount} active={false} onClick={() => setView("repo", repo)} />
        </nav>
        <div className="flex items-center justify-between px-5 pt-3 pb-1.5 text-[11px] tracking-wider text-zinc-500 uppercase">
          <span>Repositories</span>
          <span className="flex items-center gap-1.5 normal-case tracking-normal text-green-400">
            <span className="size-1.5 rounded-full bg-green-400" />
            GitHub
          </span>
        </div>
        <ScrollArea className="min-h-0 flex-1 px-2.5">
          <FileTree />
        </ScrollArea>
        <div className="flex h-10 items-center justify-between border-t border-zinc-800 px-4 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Icon name="git-branch" />
            {branch}
          </span>
          <span className="font-mono text-zinc-500">synced just now</span>
        </div>
      </aside>
    </>
  );
}
