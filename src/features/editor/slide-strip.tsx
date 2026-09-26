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

/** Transition into slide `i`: a slim vertical capsule between thumbnails (arrow over name), click to change. */
function TransitionChip({ i, value, own }: { i: number; value: string; own: boolean }) {
  const picking = useEditor((s) => s.transitionPick?.index === i);
  const set = useEditor((s) => s.set);
  const label = value === "none" ? "cut" : value;
  return (
    <button
      type="button"
      title={`Transition into slide ${i + 1}${own ? "" : " (deck default)"}: ${label}. Click to change`}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        set({ transitionPick: picking ? null : { index: i, x: r.left, y: r.top } });
      }}
      className={cn(
        "flex h-[63px] w-9 shrink-0 flex-col items-center justify-center gap-1 self-start rounded-md border font-mono text-[9px] leading-none transition-colors",
        picking ? "border-blue-500 bg-blue-500/15 text-blue-100" : own ? "border-zinc-700 text-zinc-200 hover:border-zinc-500" : "border-zinc-800/80 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300",
      )}
    >
      <Icon name="arrow-right" className="text-[11px]" />
      <span className="max-w-8 truncate">{label}</span>
    </button>
  );
}

/** Bottom film strip with the transition between each pair of thumbnails. */
export function SlideStrip() {
  const { deck, look, current, options } = useDeck();
  const actions = useDeckActions();
  const openModal = useUi((s) => s.openModal);
  const lk = useMemo(() => thumbLook(look), [look]);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => refs.current[current]?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" }), [current]);

  return (
    <nav aria-label="Slides" className="flex h-[92px] shrink-0 items-start gap-2 overflow-x-auto border-t border-zinc-800 bg-zinc-950 px-3 pt-2">
      {deck.slides.map((sl, i) => (
        <Fragment key={i}>
          {i > 0 && <TransitionChip i={i} value={sl.dir.transition || options.transition} own={!!sl.dir.transition} />}
          <button ref={(el) => void (refs.current[i] = el)} type="button" onClick={() => actions.jumpToSlide(i)} className="flex w-28 shrink-0 flex-col gap-1">
            <div className={cn("w-full rounded-md", i === current ? "ring-2 ring-blue-500" : "ring-1 ring-zinc-800 hover:ring-zinc-600")}>
              <SlideView slide={sl} index={i} total={deck.slides.length} look={lk} />
            </div>
            <span className={cn("font-mono text-[10px]", i === current ? "text-blue-400" : "text-zinc-600")}>{slideNumber(sl, i)}</span>
          </button>
        </Fragment>
      ))}
      <button type="button" onClick={() => openModal("newSlide")} className="grid h-[63px] w-20 shrink-0 place-items-center rounded-md border border-dashed border-zinc-700 text-zinc-500 hover:text-zinc-200" aria-label="Add slide">
        <Icon name="plus" />
      </button>
      <TransitionPicker />
    </nav>
  );
}
