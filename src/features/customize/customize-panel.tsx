"use client";

import type { ComponentType } from "react";
import { Icon } from "@/components/common/icon";
import { cn } from "@/lib/utils";
import { useUi, type CustomTab } from "@/stores/ui";
import { CanvasTab } from "./canvas-tab";
import { DeckTab } from "./deck-tab";
import { MotionTab } from "./motion-tab";
import { SlideTab } from "./slide-tab";
import { StyleTab } from "./style-tab";
import { TypeTab } from "./type-tab";

/** Tab registry — add a customizer section by adding one entry. */
const TABS: { id: CustomTab; label: string; C: ComponentType }[] = [
  { id: "style", label: "Style", C: StyleTab },
  { id: "canvas", label: "Canvas", C: CanvasTab },
  { id: "type", label: "Type", C: TypeTab },
  { id: "slide", label: "Slide", C: SlideTab },
  { id: "motion", label: "Motion", C: MotionTab },
  { id: "deck", label: "Deck", C: DeckTab },
];

export function CustomizePanel({ overlay }: { overlay: boolean }) {
  const { customTab, set } = useUi();
  const Active = TABS.find((t) => t.id === customTab)?.C ?? StyleTab;
  return (
    <aside
      className={cn(
        "flex w-[300px] shrink-0 flex-col border-l border-zinc-800 bg-zinc-950",
        overlay && "absolute inset-y-0 right-0 z-30 shadow-[0_0_0_9999px_rgba(0,0,0,.5)]",
      )}
    >
      <div className="flex h-11 shrink-0 items-center justify-between px-3">
        <span className="text-[13px] font-semibold">Customize</span>
        <span className="flex items-center gap-2 text-[11px] text-zinc-500">
          saved to front-matter
          <button type="button" onClick={() => set({ customOpen: false })} className="text-zinc-400 hover:text-zinc-100" aria-label="Close customizer">
            <Icon name="x" />
          </button>
        </span>
      </div>
      <div className="flex shrink-0 gap-0.5 px-2 pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => set({ customTab: t.id })}
            className={cn("h-7 flex-1 rounded-md text-xs", customTab === t.id ? "bg-zinc-800 text-zinc-50" : "text-zinc-400 hover:text-zinc-100")}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-3 pb-10">
        <Active />
      </div>
    </aside>
  );
}
