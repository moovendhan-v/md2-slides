"use client";

import { memo } from "react";
import { highlightMarkdown } from "@/domain/deck/highlight";
import type { Segment } from "@/domain/source/outline";
import { Icon } from "@/components/common/icon";
import type { OutlineActions } from "@/hooks/use-outline-actions";
import { cn } from "@/lib/utils";
import { useEditor } from "@/stores/editor";
import { upperHalf, useBlocksState } from "./blocks-state";
import { RawEditor } from "./raw-editor";
import { SEGMENT_STYLE } from "./segment-style";

/** Raw lines with the editor's syntax colours (code bodies stay plain). */
function RawLines({ seg }: { seg: Segment }) {
  const last = seg.lines.length - 1;
  return (
    <pre className="overflow-x-auto font-mono text-[13px] leading-5 whitespace-pre-wrap break-words">
      {seg.lines.map((l, i) => {
        const plain = seg.kind === "code" && i > 0 && i < last;
        return (
          <div key={i}>
            {plain ? <span className="text-zinc-300">{l || " "}</span> : highlightMarkdown(l, false).map((s, j) => <span key={j} style={{ color: s.c }}>{s.t}</span>)}
          </div>
        );
      })}
    </pre>
  );
}

interface Props {
  slide: number;
  index: number;
  seg: Segment;
  /** Absolute source line of the component's first line. */
  line: number;
  /** Last component of its slide (draws the trailing drop line). */
  last: boolean;
  actions: OutlineActions;
}

/** One draggable component: kind chip, raw Markdown, click to edit in place. */
export const SegmentCard = memo(function SegmentCard({ slide, index, seg, line, last, actions }: Props) {
  const id = `${slide}:${index}`;
  const editing = useBlocksState((s) => s.editing === id);
  const dragging = useBlocksState((s) => s.item?.type === "segment" && s.item.slide === slide && s.item.seg === index);
  const marker = useBlocksState((s) => (s.item?.type === "segment" && s.over?.slide === slide ? s.over.at : undefined));
  const set = useBlocksState((s) => s.set);
  const st = SEGMENT_STYLE[seg.kind];
  const label = seg.label === seg.kind ? st.name : seg.label;

  return (
    <div
      draggable={!editing}
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", seg.lines.join("\n"));
        set({ item: { type: "segment", slide, seg: index } });
      }}
      onDragEnd={() => set({ item: null, over: null })}
      onDragOver={(e) => {
        if (useBlocksState.getState().item?.type !== "segment") return;
        e.preventDefault();
        e.stopPropagation();
        const at = upperHalf(e) ? index : index + 1;
        const o = useBlocksState.getState().over;
        if (o?.slide !== slide || o.at !== at) set({ over: { slide, at } });
      }}
      className={cn("relative", dragging && "opacity-40")}
    >
      {marker === index && <DropLine top />}
      <div
        className={cn("group rounded-lg border border-l-2 border-zinc-800/80 bg-zinc-900/40 transition-colors hover:border-zinc-700", st.edge, editing && "border-blue-500/50")}
        onClick={() => useEditor.getState().set({ curLine: line })}
      >
        <div className="flex h-8 items-center gap-1.5 px-2">
          <span className="cursor-grab text-zinc-600 group-hover:text-zinc-400 active:cursor-grabbing" title="Drag to move">
            <Icon name="dots-six-vertical" />
          </span>
          <span className={cn("inline-flex max-w-[70%] items-center gap-1 truncate rounded border px-1.5 py-0.5 font-mono text-[11px]", st.chip)}>
            <Icon name={st.icon} />
            <span className="truncate">{label}</span>
          </span>
          <div className="flex-1" />
          <CardButton icon="pencil-simple" label="Edit raw" onClick={() => set({ editing: id })} />
          <CardButton icon="trash" label="Delete" onClick={() => actions.removeSegment(slide, index)} />
        </div>
        <div className="px-3 pb-2.5" onDoubleClick={() => set({ editing: id })}>
          {editing ? (
            <RawEditor
              value={seg.lines.join("\n")}
              onCommit={(v) => {
                actions.setSegment(slide, index, v);
                set({ editing: null });
              }}
              onCancel={() => set({ editing: null })}
            />
          ) : (
            <RawLines seg={seg} />
          )}
        </div>
      </div>
      {last && marker === index + 1 && <DropLine />}
    </div>
  );
});

function CardButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex size-6 items-center justify-center rounded text-zinc-600 opacity-0 group-hover:opacity-100 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:opacity-100"
    >
      <Icon name={icon} />
    </button>
  );
}

export function DropLine({ top }: { top?: boolean }) {
  return <div className={cn("pointer-events-none absolute inset-x-0 z-10 h-0.5 rounded bg-blue-500", top ? "-top-[5px]" : "-bottom-[5px]")} />;
}
