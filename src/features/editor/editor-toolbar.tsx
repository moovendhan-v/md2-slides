"use client";

import type { ReactNode } from "react";
import { useDeck } from "@/app-shell/deck-context";
import { sourceCount } from "@/domain/deck/paginate";
import { Icon } from "@/components/common/icon";
import { IconPicker } from "@/components/common/icon-picker";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDeckActions } from "@/hooks/use-deck-actions";
import { cn } from "@/lib/utils";
import { useAi } from "@/stores/ai";
import { useEditor } from "@/stores/editor";
import { useIsNarrow, useUi } from "@/stores/ui";

function Tool({ icon, label, tip, onClick, active, children }: { icon: string; label: string; tip: string; onClick: (e: React.MouseEvent<HTMLButtonElement>) => void; active?: boolean; children?: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" onClick={onClick} className={cn("flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] text-zinc-300 hover:bg-zinc-900", active && "bg-zinc-900 text-zinc-50")}>
          <Icon name={icon} />
          <span className="hidden lg:inline">{label}</span>
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  );
}

function ViewToggle({ icon, label, on, onClick }: { icon: string; label: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" title={label} aria-pressed={on} onClick={onClick} className={cn("flex h-7 items-center gap-1.5 rounded-md px-2 text-xs", on ? "bg-zinc-800 text-zinc-50" : "text-zinc-500 hover:text-zinc-200")}>
      <Icon name={icon} />
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
}

export function EditorToolbar() {
  const { deck } = useDeck();
  const actions = useDeckActions();
  const narrow = useIsNarrow();
  const { previewOn, stripOn, customOpen, pane, set, openModal } = useUi();
  const { insertOpen, syntaxOpen, sourceView, set: setEditor } = useEditor();
  return (
    <div className="flex h-11 shrink-0 items-center gap-0.5 overflow-x-auto border-b border-zinc-800 px-2">
      {(!narrow || pane === "editor") && (
        <div className="mr-1 flex rounded-lg bg-zinc-900/60 p-0.5" role="group" aria-label="Source view">
          <ViewToggle icon="code" label="Raw" on={sourceView === "raw"} onClick={() => setEditor({ sourceView: "raw" })} />
          <ViewToggle icon="squares-four" label="Components" on={sourceView === "blocks"} onClick={() => setEditor({ sourceView: "blocks", insertOpen: false })} />
        </div>
      )}
      <Tool
        icon="plus-square"
        label="Insert"
        tip="Insert a block (or type / on an empty line)"
        active={insertOpen}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setEditor({ insertOpen: !insertOpen, syntaxOpen: false, insertAt: { x: r.left, y: r.bottom + 6 } });
        }}
      >
        <Icon name="caret-down" className="text-[10px] text-zinc-500" />
      </Tool>
      <IconPicker onSelect={(name) => actions.insertInline(`:${name}:`)}>
        <button type="button" title="Insert an icon at the cursor (:name:)" className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] text-zinc-300 hover:bg-zinc-900">
          <Icon name="smiley" />
          <span className="hidden lg:inline">Icon</span>
        </button>
      </IconPicker>
      <Tool icon="sparkle" label="AI" tip="Generate slides with AI" onClick={() => { useAi.getState().set({ phase: "idle" }); openModal("ai"); }} />
      <Tool icon="plus" label="Slide" tip="Add slide after current" onClick={() => openModal("newSlide")} />
      <Tool icon="magic-wand" label="Format" tip="Clean whitespace" onClick={actions.format} />
      <Tool icon="book-open" label="Syntax" tip="Syntax reference" active={syntaxOpen} onClick={() => setEditor({ syntaxOpen: !syntaxOpen, insertOpen: false })} />
      <Tool icon="export" label="Export" tip="Export as HTML presentation, PDF or Markdown" onClick={() => openModal("export")} />
      <div className="flex-1" />
      <span className="hidden px-2 font-mono text-xs text-zinc-500 md:inline">
        {sourceCount(deck)} slides{deck.slides.length > sourceCount(deck) ? ` · ${deck.slides.length} pages` : ""}
      </span>
      {narrow ? (
        <div className="flex rounded-lg bg-zinc-900/60 p-0.5">
          <ViewToggle icon="code" label="Markdown" on={pane === "editor"} onClick={() => set({ pane: "editor" })} />
          <ViewToggle icon="presentation" label="Preview" on={pane === "preview"} onClick={() => set({ pane: "preview" })} />
        </div>
      ) : (
        <div className="flex rounded-lg bg-zinc-900/60 p-0.5">
          <ViewToggle icon="sidebar-simple" label="Preview" on={previewOn} onClick={() => set({ previewOn: !previewOn })} />
          <ViewToggle icon="film-strip" label="Strip" on={stripOn} onClick={() => set({ stripOn: !stripOn })} />
        </div>
      )}
      <Button variant="ghost" size="sm" className="h-8 gap-1.5 border border-zinc-800 text-[13px]" title="Share a view-only link" onClick={() => openModal("share")}>
        <Icon name="share-network" /> <span className="hidden sm:inline">Share</span>
      </Button>
      <Button variant="ghost" size="sm" className={cn("h-8 gap-1.5 border border-zinc-800 text-[13px]", customOpen && "bg-zinc-900")} onClick={() => set({ customOpen: !customOpen })}>
        <Icon name="sliders-horizontal" /> <span className="hidden sm:inline">Customize</span>
      </Button>
      <Button size="sm" className="h-8 gap-1.5 bg-blue-600 text-[13px] font-semibold text-white hover:bg-blue-500" onClick={() => actions.present()}>
        <Icon name="play" /> Present
      </Button>
    </div>
  );
}
