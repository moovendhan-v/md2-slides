"use client";

import { Fragment, useMemo } from "react";
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

/** Bottom film strip with per-slide transition chips between thumbnails. */
export function SlideStrip() {
  const { deck, look, current, options } = useDeck();
  const actions = useDeckActions();
  const picking = useEditor((s) => s.transitionPick?.index);
  const set = useEditor((s) => s.set);
  const openModal = useUi((s) => s.openModal);
  const lk = useMemo(() => thumbLook(look), [look]);
  return (
    <div className="flex h-[92px] shrink-0 items-center gap-2 overflow-x-auto border-t border-zinc-800 bg-zinc-950 px-3">
      {deck.slides.map((sl, i) => {
        const own = sl.dir.transition;
        const tr = own || options.transition;
        return (
          <Fragment key={i}>
            {i > 0 && (
              <button
                type="button"
                title={`Transition into slide ${i + 1}${own ? "" : " (deck default)"} — click to change`}
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  set({ transitionPick: picking === i ? null : { index: i, x: r.left, y: r.top } });
                }}
                className={cn(
                  "flex h-6 shrink-0 items-center gap-1 rounded-full border px-2 text-[10px]",
                  picking === i ? "border-blue-500 bg-blue-500/15 text-zinc-50" : own ? "border-zinc-600 text-zinc-100" : "border-zinc-800 text-zinc-500",
                )}
              >
                <Icon name="arrows-left-right" />
                {tr === "none" ? "cut" : tr}
              </button>
            )}
            <button type="button" onClick={() => actions.jumpToSlide(i)} className="flex w-28 shrink-0 flex-col gap-1">
              <div className={cn("w-full rounded-md", i === current ? "ring-2 ring-blue-500" : "ring-1 ring-zinc-800")}>
                <SlideView slide={sl} index={i} total={deck.slides.length} look={lk} />
              </div>
              <span className={cn("font-mono text-[10px]", i === current ? "text-blue-400" : "text-zinc-600")}>{slideNumber(sl, i)}</span>
            </button>
          </Fragment>
        );
      })}
      <button type="button" onClick={() => openModal("newSlide")} className="grid h-[63px] w-20 shrink-0 place-items-center rounded-md border border-dashed border-zinc-700 text-zinc-500 hover:text-zinc-200" aria-label="Add slide">
        <Icon name="plus" />
      </button>
      <TransitionPicker />
    </div>
  );
}
