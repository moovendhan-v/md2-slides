"use client";

import { useDeck } from "@/app-shell/deck-context";
import { Icon } from "@/components/common/icon";
import { Kbd } from "@/components/common/controls";
import { Button } from "@/components/ui/button";
import { useUi } from "@/stores/ui";
import { selectChanged, useWorkspace } from "@/stores/workspace";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { BRAND } from "@/lib/brand";
import { UserMenu } from "./user-menu";

export function AppHeader() {
  const { repo: activeRepo, path } = useDeck();
  const repoView = useUi((s) => s.repoView);
  const repo = activeRepo || repoView || "";
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
        <Link href="/" title={`${BRAND.name} home`} className="flex items-center">
          <Logo size={26} wordmark />
        </Link>
        <span className="text-zinc-600">/</span>
        <span className="truncate text-zinc-400">{repo}</span>
        {view === "editor" && path && (
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
        className="hidden h-8 w-60 items-center whitespace-nowrap gap-2 rounded-lg border border-zinc-800 px-3 text-[13px] text-zinc-500 hover:border-zinc-700 md:flex"
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
