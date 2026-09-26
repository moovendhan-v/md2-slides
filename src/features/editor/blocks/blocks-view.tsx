"use client";

import { useMemo } from "react";
import { parseOutline } from "@/domain/source/outline";
import { Icon } from "@/components/common/icon";
import { useOutlineActions } from "@/hooks/use-outline-actions";
import { useEditor } from "@/stores/editor";
import { useActiveSource } from "@/stores/workspace";
import { slideDest, useBlocksState } from "./blocks-state";
import { SlideCard } from "./slide-card";

/**
 * Component view of the deck source: every slide as a card listing the
 * components it is written with, colour-coded by kind. Drag slide headers to
 * reorder slides, drag components within or across slides, and edit any
 * component (or a whole slide) as raw Markdown in place.
 */
export function BlocksView() {
  const src = useActiveSource();
  const outline = useMemo(() => parseOutline(src), [src]);
  const actions = useOutlineActions();
  const curLine = useEditor((s) => s.curLine);
  const set = useBlocksState((s) => s.set);
  const slides = outline.slides;
  const active = slides.findLastIndex((s) => s.line <= curLine);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const { item, over } = useBlocksState.getState();
    set({ item: null, over: null });
    if (!item || !over) return;
    if (item.type === "slide" && over.before !== undefined) actions.moveSlide(item.slide, slideDest(item.slide, over.slide, over.before));
    if (item.type === "segment" && over.at !== undefined) actions.moveSegment(item.slide, item.seg, over.slide, over.at);
  };

  const addSlide = () => {
    actions.addSlide();
    // Open the new slide as raw Markdown so it can be written straight away.
    set({ raw: { ...useBlocksState.getState().raw, [slides.length]: true } });
    requestAnimationFrame(() => document.querySelector(`[data-slide="${slides.length}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-950" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <div className="flex items-center gap-2 border-b border-zinc-900 px-4 py-2 text-[11px] font-semibold tracking-wider text-amber-400/90 uppercase">
        <Icon name="palette" /> Component view
        <span className="font-normal tracking-normal text-zinc-500 normal-case">· drag to reorder · double-click to edit raw</span>
      </div>
      <div className="flex flex-col gap-5 p-4 pb-24">
        {outline.head.length > 0 && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2 font-mono text-xs text-zinc-500">
            Front matter · {outline.head.length - 2} setting{outline.head.length === 3 ? "" : "s"}
          </div>
        )}
        {slides.map((s, i) => (
          <SlideCard key={i} index={i} slide={s} active={i === active} actions={actions} />
        ))}
        <button type="button" onClick={addSlide} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-800 text-[13px] text-zinc-400 hover:border-zinc-600 hover:text-zinc-100">
          <Icon name="plus" /> New slide
        </button>
      </div>
    </div>
  );
}
