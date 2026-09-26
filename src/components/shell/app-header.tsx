"use client";

import { useDeck } from "@/app-shell/deck-context";
import { Icon } from "@/components/common/icon";
import { Kbd } from "@/components/common/controls";
import { Button } from "@/components/ui/button";
import { useUi } from "@/stores/ui";
import { selectChanged, useWorkspace } from "@/stores/workspace";
import { UserMenu } from "./user-menu";

export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-md bg-zinc-50 text-zinc-950" style={{ width: size, height: size }}>
      <Icon name="presentation" style={{ fontSize: size * 0.6 }} />
    </span>
  );
}

export function AppHeader() {
  const { repo, path } = useDeck();
  const view = useUi((s) => s.view);
  const set = useUi((s) => s.set);
  const openModal = useUi((s) => s.openModal);
  const changes = useWorkspace((s) => selectChanged(s).length);
  return (
    <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-zinc-800 px-3">
      <Button variant="ghost" size="icon" className="size-8 text-zinc-400" onClick={() => set({ sidebarOpen: !useUi.getState().sidebarOpen })} aria-label="Toggle sidebar">
        <Icon name="sidebar-simple" className="text-lg" />
      </Button>
      <div className="flex min-w-0 items-center gap-2 text-[13px]">
        <BrandMark />
        <span className="font-semibold text-zinc-50">Slidewise</span>
        <span className="text-zinc-600">/</span>
        <span className="truncate text-zinc-400">{repo}</span>
        {view === "editor" && (
          <>
            <span className="hidden text-zinc-600 sm:inline">/</span>
            <span className="hidden truncate text-zinc-100 sm:inline">{path}</span>
          </>
        )}
      </div>
      <div className="flex-1" />
      <button
        type="button"
        onClick={() => openModal("palette")}
        className="hidden h-8 w-56 items-center gap-2 rounded-lg border border-zinc-800 px-3 text-[13px] text-zinc-500 hover:border-zinc-700 md:flex"
      >
        <Icon name="magnifying-glass" />
        <span className="flex-1 text-left">Search files & commands</span>
        <Kbd>⌘K</Kbd>
      </button>
      <Button size="sm" className="relative h-8 gap-1.5 bg-zinc-50 font-semibold text-zinc-950 hover:bg-zinc-200" onClick={() => openModal("commit")}>
        <Icon name="git-commit" />
        Commit
        {changes > 0 && <span className="absolute -top-1.5 -right-1.5 grid size-4 place-items-center rounded-full bg-amber-400 text-[10px] font-bold text-zinc-950">{changes}</span>}
      </Button>
      <UserMenu />
    </header>
  );
}
