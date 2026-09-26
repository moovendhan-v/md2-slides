"use client";

import { useEffect, useState } from "react";
import { DeckProvider, useDeck } from "@/app-shell/deck-context";
import { Providers } from "@/app-shell/providers";
import { BootScreen } from "@/components/shell/boot-screen";
import { Icon } from "@/components/common/icon";
import { sourceCount } from "@/domain/deck/paginate";
import { CustomizePanel } from "@/features/customize/customize-panel";
import { BlockPicker } from "@/features/editor/block-picker";
import { BlocksView } from "@/features/editor/blocks/blocks-view";
import { InsertMenu } from "@/features/editor/insert-menu";
import { NewSlideDialog } from "@/features/editor/new-slide-dialog";
import { PreviewPane } from "@/features/editor/preview-pane";
import { Presenter } from "@/features/present/presenter";
import { useDeckActions } from "@/hooks/use-deck-actions";
import { useViewportWidth } from "@/hooks/use-viewport-width";
import { cn } from "@/lib/utils";
import { usePresent } from "@/stores/present";
import { useIsNarrow, useUi } from "@/stores/ui";
import { onHost } from "./bridge";
import type { EmbedSettings } from "./protocol";
import { useVscodeSync } from "./use-vscode-sync";

function Toggle({ icon, label, on, onClick }: { icon: string; label: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" title={label} aria-pressed={on} onClick={onClick} className={cn("flex h-7 items-center gap-1.5 rounded-md px-2 text-xs", on ? "bg-zinc-800 text-zinc-50" : "text-zinc-500 hover:text-zinc-200")}>
      <Icon name={icon} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

/** Slides panel inside VS Code: the app's preview, component view, customizer and presenter. */
function EmbedShell({ settings }: { settings: EmbedSettings }) {
  const { deck, path } = useDeck();
  const actions = useDeckActions();
  const narrow = useIsNarrow();
  const [view, setView] = useState(settings.view);
  const customOpen = useUi((s) => s.customOpen);
  const presenting = usePresent((s) => s.active);

  useEffect(() => onHost((m) => m.type === "present" && actions.present()), [actions]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-zinc-950">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-zinc-800 px-2">
        <div className="flex rounded-lg bg-zinc-900/60 p-0.5" role="group" aria-label="View">
          <Toggle icon="presentation" label="Slides" on={view === "preview"} onClick={() => setView("preview")} />
          <Toggle icon="squares-four" label="Components" on={view === "blocks"} onClick={() => setView("blocks")} />
        </div>
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-500">
          {path} · {sourceCount(deck)} slides
        </span>
        <button type="button" onClick={() => useUi.getState().set({ customOpen: !customOpen })} className={cn("flex h-8 items-center gap-1.5 rounded-md border border-zinc-800 px-2.5 text-[13px] text-zinc-300 hover:bg-zinc-900", customOpen && "bg-zinc-900")}>
          <Icon name="sliders-horizontal" /> <span className="hidden sm:inline">Customize</span>
        </button>
        <button type="button" onClick={() => actions.present()} className="flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-[13px] font-semibold text-white hover:bg-blue-500">
          <Icon name="play" /> Present
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1">
        {view === "blocks" && (
          <div className="relative flex min-w-0 flex-1 flex-col">
            <BlocksView />
          </div>
        )}
        {(view === "preview" || !narrow) && <PreviewPane />}
        {customOpen && <CustomizePanel overlay={narrow} />}
      </div>
      <InsertMenu />
      <BlockPicker />
      <NewSlideDialog />
      {presenting && <Presenter />}
    </div>
  );
}

function Synced() {
  useViewportWidth();
  const settings = useVscodeSync();
  if (!settings) return <BootScreen label="Opening deck…" />;
  return (
    <DeckProvider>
      <EmbedShell settings={settings} />
    </DeckProvider>
  );
}

export function EmbedApp() {
  return (
    <Providers>
      <Synced />
    </Providers>
  );
}
