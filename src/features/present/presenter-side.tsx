"use client";

import { useDeck } from "@/app-shell/deck-context";
import { Seg } from "@/components/common/controls";
import { Swatch } from "@/components/common/controls";
import { SlideView } from "@/components/slide/slide-view";
import { thumbLook } from "@/domain/deck/look";
import { usePresent } from "@/stores/present";
import { useTimer } from "./presenter-toolbar";

const PEN_COLORS = ["#ef4444", "#facc15", "#3b82f6", "#fafafa"];

/** Right column: up-next slide, speaker notes, pen colours and time limit. */
export function PresenterSide({ index, notes: showNotes = true }: { index: number; notes?: boolean }) {
  const { deck, look } = useDeck();
  const p = usePresent();
  const timer = useTimer();
  const next = deck.slides[index + 1];
  const notes = deck.slides[index]?.notes.trim();
  return (
    <aside className="hidden w-[400px] shrink-0 flex-col gap-3 lg:flex">
      <span className="text-xs text-zinc-500">{next ? "Up next" : "End of deck"}</span>
      {next ? (
        <SlideView slide={next} index={index + 1} total={deck.slides.length} look={thumbLook(look)} />
      ) : (
        <div className="grid aspect-video place-items-center rounded-xl border border-zinc-800 text-sm text-zinc-500">That&apos;s the last slide</div>
      )}
      {showNotes ? (
        <>
          <span className="text-xs text-zinc-500">Speaker notes</span>
          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl bg-zinc-900/70 p-4 text-[15px] leading-relaxed whitespace-pre-wrap text-zinc-100">
            {notes || "No notes for this slide. Add a line starting with Note: in the Markdown."}
          </div>
        </>
      ) : (
        <div className="flex-1" />
      )}
      {p.pen && (
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          Pen
          {PEN_COLORS.map((c) => (
            <Swatch key={c} color={c} active={p.penColor === c} onClick={() => p.set({ penColor: c })} />
          ))}
          <button type="button" className="ml-auto hover:text-zinc-100" onClick={() => p.set({ inkClear: p.inkClear + 1 })}>
            Clear (C)
          </button>
        </div>
      )}
      <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
        Time limit
        <Seg
          size="sm"
          value={p.limitMin}
          onChange={(v) => p.set({ limitMin: v, startedAt: Date.now() })}
          options={[0, 5, 10, 20, 45].map((id) => ({ id, label: id ? `${id}m` : "Off" }))}
        />
      </div>
      {p.limitMin > 0 && (
        <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full transition-all" style={{ width: `${timer.pct}%`, background: timer.color }} />
        </div>
      )}
      <p className="text-[11px] leading-relaxed text-zinc-600">← → navigate / reveal · D pen · C clear · L laser · B blackout · F fullscreen · Z zoom · T strip · O overview · Esc exit</p>
    </aside>
  );
}
