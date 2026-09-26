"use client";

import { memo } from "react";
import { BLOCK_SNIPPETS } from "@/data";
import type { OutlineSlide } from "@/domain/source/outline";
import { Icon } from "@/components/common/icon";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { OutlineActions } from "@/hooks/use-outline-actions";
import { cn } from "@/lib/utils";
import { useEditor } from "@/stores/editor";
import { upperHalf, useBlocksState } from "./blocks-state";
import { RawEditor } from "./raw-editor";
import { DropLine, SegmentCard } from "./segment-card";

interface Props {
  index: number;
  slide: OutlineSlide;
  active: boolean;
  actions: OutlineActions;
}

const trimBlank = (lines: string[]) => lines.join("\n").replace(/^\s*\n|\n\s*$/g, "");

/**
 * One slide in the Blocks view: a draggable delimiter header and its
 * components, or the whole slide as a single raw Markdown box.
 */
export const SlideCard = memo(function SlideCard({ index, slide, active, actions }: Props) {
  const raw = useBlocksState((s) => !!s.raw[index]);
  const dragging = useBlocksState((s) => s.item?.type === "slide" && s.item.slide === index);
  const over = useBlocksState((s) => (s.item?.type === "slide" && s.over?.slide === index ? s.over.before : undefined));
  const endDrop = useBlocksState((s) => s.item?.type === "segment" && s.over?.slide === index && s.over.at === slide.segments.length && !slide.segments.length);
  const set = useBlocksState((s) => s.set);
  const title = slide.segments.find((s) => s.kind === "heading")?.label.replace(/^#+\s*/, "") ?? "Untitled";
  const setRaw = (on: boolean) => set({ raw: { ...useBlocksState.getState().raw, [index]: on } });

  return (
    <section
      onDragOver={(e) => {
        const { item, over: o } = useBlocksState.getState();
        if (!item) return;
        e.preventDefault();
        const next = item.type === "slide" ? { slide: index, before: upperHalf(e) } : { slide: index, at: slide.segments.length };
        if (o?.slide !== next.slide || o.before !== next.before || o.at !== next.at) set({ over: next });
      }}
      className={cn("relative scroll-mt-3", dragging && "opacity-40")}
      data-slide={index}
    >
      {over === true && <DropLine top />}
      <header
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", `slide ${index + 1}`);
          set({ item: { type: "slide", slide: index } });
        }}
        onDragEnd={() => set({ item: null, over: null })}
        onClick={() => useEditor.getState().set({ curLine: slide.line })}
        className={cn(
          "group flex h-10 cursor-grab items-center gap-2 rounded-xl border px-3 font-mono text-xs font-semibold tracking-wider active:cursor-grabbing",
          active ? "border-amber-400/60 bg-amber-400/15 text-amber-200" : "border-amber-500/30 bg-amber-500/[.07] text-amber-300/90",
        )}
      >
        <Icon name="dots-six-vertical" className="text-amber-500/60" />
        <span className="shrink-0">--- SLIDE {String(index + 1).padStart(2, "0")}</span>
        <span className="truncate font-sans font-medium tracking-normal text-zinc-300">{title}</span>
        <div className="flex-1" />
        <HeaderButton icon={raw ? "squares-four" : "code-simple"} label={raw ? "Show components" : "Edit slide as raw Markdown"} onClick={() => setRaw(!raw)} />
        <AddComponent onPick={(md) => actions.appendSegment(index, md)} />
        <HeaderButton icon="trash" label="Delete slide" onClick={() => actions.removeSlide(index)} />
      </header>

      <div className="mt-2 flex flex-col gap-2 pl-3">
        {raw ? (
          <RawEditor
            value={trimBlank(slide.lines)}
            autoFocus={false}
            placeholder="## Slide title"
            onCommit={(v) => actions.setSlide(index, v)}
            onCancel={() => {}}
            key={slide.lines.join("\n")}
          />
        ) : slide.segments.length ? (
          slide.segments.map((seg, k) => (
            <SegmentCard key={`${k}:${seg.lines[0]}`} slide={index} index={k} seg={seg} line={slide.line + seg.start} last={k === slide.segments.length - 1} actions={actions} />
          ))
        ) : (
          <div className={cn("relative rounded-lg border border-dashed border-zinc-800 px-3 py-4 text-center text-xs text-zinc-500", endDrop && "border-blue-500/60 text-blue-300")}>
            Empty slide · drop a component here or use <Icon name="plus" /> to add one
          </div>
        )}
      </div>
      {over === false && <DropLine />}
    </section>
  );
});

function HeaderButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex size-7 items-center justify-center rounded-md text-amber-300/60 hover:bg-amber-400/10 hover:text-amber-100"
    >
      <Icon name={icon} />
    </button>
  );
}

function AddComponent({ onPick }: { onPick: (md: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" title="Add component" aria-label="Add component" onClick={(e) => e.stopPropagation()} className="flex size-7 items-center justify-center rounded-md text-amber-300/60 hover:bg-amber-400/10 hover:text-amber-100">
          <Icon name="plus" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 w-56 overflow-y-auto">
        {BLOCK_SNIPPETS.map((s) => (
          <DropdownMenuItem key={s.label} onSelect={() => onPick(s.md)} className="gap-2 text-[13px]">
            <Icon name={s.icon || "cube"} className="text-zinc-400" /> {s.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
