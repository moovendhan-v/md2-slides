"use client";

import { useEffect, useState } from "react";
import { useDeck } from "@/app-shell/deck-context";
import { Icon } from "@/components/common/icon";
import { clickCount } from "@/domain/deck/queries";
import { presenterStep, toggleFullscreen } from "@/hooks/use-global-keys";
import { cn } from "@/lib/utils";
import { usePresent } from "@/stores/present";
import { useUi } from "@/stores/ui";

const fmt = (x: number) => `${String(Math.floor(Math.abs(x) / 60)).padStart(2, "0")}:${String(Math.abs(x) % 60).padStart(2, "0")}`;

/** Elapsed / remaining time, re-rendered once per second. */
export function useTimer() {
  const { startedAt, limitMin } = usePresent();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const sec = Math.max(0, Math.floor((now - startedAt) / 1000));
  const left = limitMin * 60 - sec;
  return {
    sec,
    left,
    label: limitMin ? `${left < 0 ? "+" : ""}${fmt(left)}${left < 0 ? " over" : " left"}` : fmt(sec),
    pct: limitMin ? Math.min(100, (sec / (limitMin * 60)) * 100) : 0,
    color: left < 60 ? "#ef4444" : left < 180 ? "#fbbf24" : "#4ade80",
  };
}

function Tool({ icon, label, active, tip, onClick }: { icon: string; label: string; active?: boolean; tip: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={tip}
      onClick={onClick}
      className={cn("flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs", active ? "border-blue-500 bg-blue-500/15 text-zinc-50" : "border-zinc-800 text-zinc-400 hover:text-zinc-100")}
    >
      <Icon name={icon} />
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}

export function PresenterToolbar({ index, total }: { index: number; total: number }) {
  const { deck, options } = useDeck();
  const p = usePresent();
  const timer = useTimer();
  const clicks = clickCount(deck.slides[index], options);
  return (
    <div className="flex h-[52px] shrink-0 items-center gap-2 overflow-x-auto px-4">
      <span className="font-mono text-lg font-semibold" style={{ color: p.limitMin ? timer.color : undefined }}>
        {timer.label}
      </span>
      <span className="text-xs whitespace-nowrap text-zinc-400">
        Slide {index + 1} of {total}
        {clicks ? ` · click ${p.click}/${clicks}` : ""}
      </span>
      <div className="flex-1" />
      <Tool icon="pen-nib" label="Pen" tip="D — draw on slide" active={p.pen} onClick={() => p.set({ pen: !p.pen, laser: false })} />
      <Tool icon="cursor-click" label="Laser" tip="L" active={p.laser} onClick={() => p.set({ laser: !p.laser, pen: false })} />
      <Tool icon="moon" label="Blackout" tip="B" active={p.black} onClick={() => p.set({ black: !p.black })} />
      <Tool icon="magnifying-glass-plus" label={p.zoom === "fit" ? "Fit" : p.zoom} tip="Z — zoom; scroll when larger" active={p.zoom !== "fit"} onClick={p.cycleZoom} />
      <Tool icon="film-strip" label="Slides" tip="T" active={p.strip} onClick={() => p.set({ strip: !p.strip })} />
      <Tool icon="grid-nine" label="Overview" tip="O" active={p.overview} onClick={() => p.set({ overview: !p.overview })} />
      <Tool icon="share-network" label="Share" tip="Share live link" onClick={() => useUi.getState().openModal("share")} />
      <Tool icon="corners-out" label="Full" tip="F" onClick={toggleFullscreen} />
      <button type="button" onClick={() => presenterStep(-1, deck.slides, options)} className="grid size-8 place-items-center rounded-md border border-zinc-800 hover:bg-zinc-900" aria-label="Previous">
        <Icon name="caret-left" />
      </button>
      <button type="button" onClick={() => presenterStep(1, deck.slides, options)} className="grid size-8 place-items-center rounded-md border border-zinc-800 hover:bg-zinc-900" aria-label="Next">
        <Icon name="caret-right" />
      </button>
      <button type="button" onClick={p.stop} className="h-8 rounded-md bg-zinc-50 px-3 text-xs font-semibold text-zinc-950 hover:bg-zinc-200">
        Exit
      </button>
    </div>
  );
}
