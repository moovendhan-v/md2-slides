"use client";

import { useEffect, useRef } from "react";
import { slideLabel } from "@/domain/deck/queries";
import { transitionCss } from "@/domain/deck/slide-frame";
import { slideNumber } from "@/domain/deck/paginate";
import { useDeck } from "@/app-shell/deck-context";
import { Seg } from "@/components/common/controls";
import { Icon } from "@/components/common/icon";
import { SlideView } from "@/components/slide/slide-view";
import { useDeckActions } from "@/hooks/use-deck-actions";
import { cn } from "@/lib/utils";
import { useEditor } from "@/stores/editor";
import { useUi } from "@/stores/ui";
import { useEditRenderOpts } from "./use-edit-render-opts";

function SlideActions({ i }: { i: number }) {
  const actions = useDeckActions();
  const items: [string, string, () => void, string?][] = [
    ["arrow-line-down-right", "Jump to source", () => actions.jumpToSlide(i)],
    ["play", "Present from here", () => actions.present(i)],
    ["copy", "Duplicate slide", () => actions.duplicateSlide(i)],
    ["trash", "Delete slide", () => actions.deleteSlide(i), "hover:text-red-400"],
  ];
  return (
    <div className="flex items-center gap-0.5">
      {items.map(([icon, tip, on, cls]) => (
        <button key={icon} type="button" title={tip} onClick={on} className={cn("grid size-7 place-items-center rounded-md text-zinc-500 hover:bg-zinc-900 hover:text-zinc-100", cls)}>
          <Icon name={icon} />
        </button>
      ))}
    </div>
  );
}

function AllSlides() {
  const { deck, look, current } = useDeck();
  const opts = useEditRenderOpts();
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    refs.current[current]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [current]);
  return (

    <div className="flex flex-col gap-6">
      {deck.slides.map((sl, i) => (
        <div key={i} ref={(el) => void (refs.current[i] = el)} className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span className={cn("font-mono", i === current ? "text-blue-400" : "text-zinc-500")}>{slideNumber(sl, i)}</span>
            <span className="flex-1 truncate text-zinc-300">{slideLabel(sl, i)}</span>
            {(sl.parts ?? 1) > 1 && <span className="rounded bg-zinc-900 px-1.5 text-[10px] text-zinc-500" title="Content continues on the next slide automatically. Add <!-- split: false --> to keep it on one slide.">auto-split {(sl.part ?? 0) + 1}/{sl.parts}</span>}
            {sl.imported && <span className="rounded bg-zinc-900 px-1.5 text-[10px] text-zinc-500">⎘ {sl.imported}</span>}
            {sl.notes.trim() && (
              <span className="flex items-center gap-1 text-pink-400">
                <Icon name="note" /> Notes
              </span>
            )}
            <SlideActions i={i} />
          </div>
          <div className={cn("rounded-[14px] p-0.5", i === current && "ring-1 ring-blue-500")}>
            <SlideView slide={sl} index={i} total={deck.slides.length} look={look} opts={opts} />
          </div>
          {sl.notes.trim() && <p className="rounded-lg bg-zinc-900/60 px-3 py-2 text-xs text-zinc-400">{sl.notes}</p>}
        </div>
      ))}
    </div>
  );
}

function FocusSlide() {
  const { deck, look, current, options } = useDeck();
  const seed = useEditor((s) => s.focusSeed);
  const set = useEditor((s) => s.set);
  const actions = useDeckActions();
  const i = Math.min(current, deck.slides.length - 1);
  const sl = deck.slides[i];
  const opts = useEditRenderOpts(true, seed);
  if (!sl) return null;
  const go = (k: number) => {
    if (!deck.slides[k]) return;
    actions.jumpToSlide(k);
    set({ focusSeed: seed + 1 });
  };
  return (
    <div className="flex flex-col gap-3">
      <div key={seed} style={{ animation: transitionCss(sl.dir.transition || options.transition) }}>
        <SlideView slide={sl} index={i} total={deck.slides.length} look={look} opts={opts} />
      </div>
      <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
        <button type="button" onClick={() => go(i - 1)} className="grid size-8 place-items-center rounded-md border border-zinc-800 hover:bg-zinc-900" aria-label="Previous slide">
          <Icon name="caret-left" />
        </button>
        <span className="w-16 text-center font-mono">
          {slideNumber(sl, i)} / {String(sl.sourceTotal ?? deck.slides.length).padStart(2, "0")}
        </span>
        <button type="button" onClick={() => go(i + 1)} className="grid size-8 place-items-center rounded-md border border-zinc-800 hover:bg-zinc-900" aria-label="Next slide">
          <Icon name="caret-right" />
        </button>
        <button type="button" onClick={() => set({ focusSeed: seed + 1 })} className="ml-2 flex items-center gap-1 rounded-md px-2 py-1 hover:bg-zinc-900">
          <Icon name="arrow-counter-clockwise" /> Replay
        </button>
      </div>
      {sl.notes.trim() && <p className="rounded-lg bg-zinc-900/60 px-3 py-2 text-xs text-zinc-400">{sl.notes}</p>}
    </div>
  );
}

export function PreviewPane() {
  const { previewMode, set } = useUi();
  return (
    <div className="flex min-h-0 flex-1 flex-col border-l border-zinc-800 bg-[#0c0c0e]">
      <div className="flex shrink-0 items-center gap-3 px-6 pt-4 pb-3 text-xs text-zinc-500">
        <Icon name="cursor-click" className="text-base" />
        <span className="flex-1">Click any block to restyle it · click a title to jump to its line</span>
        <Seg
          size="sm"
          value={previewMode}
          onChange={(v) => set({ previewMode: v })}
          options={[
            { id: "all", label: "All", icon: "rows" },
            { id: "focus", label: "Focus", icon: "frame-corners" },
          ]}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8">{previewMode === "focus" ? <FocusSlide /> : <AllSlides />}</div>
    </div>
  );
}
