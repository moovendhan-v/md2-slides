"use client";

import { Fragment, useEffect, useMemo, useRef } from "react";
import { thumbLook } from "@/domain/deck/look";
import { slideNumber } from "@/domain/deck/paginate";
import { useDeck } from "@/app-shell/deck-context";
import { Icon } from "@/components/common/icon";
import { SlideView } from "@/components/slide/slide-view";
import { useDeckActions } from "@/hooks/use-deck-actions";
import { cn } from "@/lib/utils";
import { useEditor } from "@/stores/editor";
import { useUi } from "@/stores/ui";
import { TransitionPicker } from "./transition-picker";

type Orientation = "vertical" | "horizontal";

/** Transition into slide `i`: a quiet connector between thumbnails, click to change. */
function TransitionChip({ i, value, own, vertical }: { i: number; value: string; own: boolean; vertical: boolean }) {
  const picking = useEditor((s) => s.transitionPick?.index === i);
  const set = useEditor((s) => s.set);
  const label = value === "none" ? "cut" : value;
  return (
    <div className={cn("flex shrink-0 items-center justify-center", vertical ? "h-6 w-full" : "h-full w-auto")}>
      <button
        type="button"
        title={`Transition into slide ${i + 1}${own ? "" : " (deck default)"}: ${label}. Click to change`}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          set({ transitionPick: picking ? null : vertical ? { index: i, x: r.right, y: r.top, side: "right" } : { index: i, x: r.left, y: r.top } });
        }}
        className={cn(
          "group flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[10px] leading-none transition-colors",
          picking ? "bg-blue-500/15 text-blue-200" : own ? "text-zinc-300 hover:bg-zinc-900" : "text-zinc-600 hover:bg-zinc-900 hover:text-zinc-300",
        )}
      >
        <Icon name={vertical ? "arrow-down" : "arrow-right"} className="text-[9px]" />
        <span className="max-w-20 truncate">{label}</span>
      </button>
    </div>
  );
}

/**
 * Film strip of slide thumbnails with the transition between each pair.
 * Vertical beside the editor on wide screens, horizontal along the bottom on narrow ones.
 */
export function SlideStrip({ orientation = "vertical" }: { orientation?: Orientation }) {
  const { deck, look, current, options } = useDeck();
  const actions = useDeckActions();
  const openModal = useUi((s) => s.openModal);
  const lk = useMemo(() => thumbLook(look), [look]);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const vertical = orientation === "vertical";
  useEffect(() => refs.current[current]?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" }), [current]);

  return (
    <nav
      aria-label="Slides"
      className={cn(
        "flex shrink-0 bg-zinc-950",
        vertical ? "w-44 flex-col overflow-y-auto border-r border-zinc-800 px-3 py-3" : "h-[92px] items-center gap-2 overflow-x-auto border-t border-zinc-800 px-3",
      )}
    >
      {deck.slides.map((sl, i) => (
        <Fragment key={i}>
          {i > 0 && <TransitionChip i={i} value={sl.dir.transition || options.transition} own={!!sl.dir.transition} vertical={vertical} />}
          <button
            ref={(el) => void (refs.current[i] = el)}
            type="button"
            onClick={() => actions.jumpToSlide(i)}
            className={cn("flex shrink-0 gap-1.5", vertical ? "w-full items-start" : "w-28 flex-col")}
          >
            {vertical && <span className={cn("w-7 pt-0.5 text-right font-mono text-[10px]", i === current ? "text-blue-400" : "text-zinc-600")}>{slideNumber(sl, i)}</span>}
            <div className={cn("min-w-0 flex-1 rounded-md", i === current ? "ring-2 ring-blue-500" : "ring-1 ring-zinc-800 hover:ring-zinc-600")}>
              <SlideView slide={sl} index={i} total={deck.slides.length} look={lk} />
            </div>
            {!vertical && <span className={cn("font-mono text-[10px]", i === current ? "text-blue-400" : "text-zinc-600")}>{slideNumber(sl, i)}</span>}
          </button>
        </Fragment>
      ))}
      <button
        type="button"
        onClick={() => openModal("newSlide")}
        aria-label="Add slide"
        className={cn("grid shrink-0 place-items-center rounded-md border border-dashed border-zinc-700 text-zinc-500 hover:text-zinc-200", vertical ? "mt-3 ml-8 h-12" : "h-[63px] w-20")}
      >
        <Icon name="plus" />
      </button>
      <TransitionPicker />
    </nav>
  );
}
