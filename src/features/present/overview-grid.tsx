"use client";

import { useDeck } from "@/app-shell/deck-context";
import { Icon } from "@/components/common/icon";
import { SlideView } from "@/components/slide/slide-view";
import { slideLabel } from "@/domain/deck/queries";
import { slideNumber } from "@/domain/deck/paginate";
import { cn } from "@/lib/utils";
import { usePresent } from "@/stores/present";

export function OverviewGrid({ current }: { current: number }) {
  const { deck, look } = useDeck();
  const p = usePresent();
  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-black p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium">Overview</span>
        <button type="button" onClick={() => p.set({ overview: false })} className="text-zinc-400 hover:text-zinc-100" aria-label="Close overview">
          <Icon name="x" />
        </button>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-5 overflow-y-auto md:grid-cols-3 xl:grid-cols-4">
        {deck.slides.map((s, k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              p.goTo(k);
              p.set({ overview: false });
            }}
            className="flex flex-col gap-1.5 text-left"
          >
            <div className={cn("rounded-lg", k === current ? "ring-2 ring-blue-500" : "ring-1 ring-zinc-800")}>
              <SlideView slide={s} index={k} total={deck.slides.length} look={look} />
            </div>
            <span className="truncate text-xs text-zinc-400">
              <span className="font-mono text-zinc-500">{slideNumber(s, k)}</span> {slideLabel(s, k)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
