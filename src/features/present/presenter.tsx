"use client";

import { useMemo, useState } from "react";
import { codeLines, clickCount } from "@/domain/deck/queries";
import { thumbLook } from "@/domain/deck/look";
import { transitionCss } from "@/domain/deck/slide-frame";
import { slideNumber } from "@/domain/deck/paginate";
import { useDeck } from "@/app-shell/deck-context";
import { SlideView } from "@/components/slide/slide-view";
import { cn } from "@/lib/utils";
import { usePresent } from "@/stores/present";
import { InkCanvas } from "./ink-canvas";
import { OverviewGrid } from "./overview-grid";
import { PresenterSide } from "./presenter-side";
import { PresenterToolbar } from "./presenter-toolbar";
import { ShareDialog } from "./share-dialog";

/** Full-screen presenter view: current slide, next slide, notes, timer, tools. */
export function Presenter() {
  const { deck, look, options } = useDeck();
  const p = usePresent();
  const [laserAt, setLaserAt] = useState<{ x: number; y: number } | null>(null);
  const n = deck.slides.length;
  const i = Math.min(p.index, n - 1);
  const sl = deck.slides[i];
  const tr = sl?.dir.transition || options.transition;
  const opts = useMemo(
    () => ({ animate: true, seed: i, clicks: clickCount(sl, options) ? p.click : null, codeStep: p.click, prevCode: codeLines(deck.slides[i - 1]) }),
    [i, sl, options, p.click, deck.slides],
  );
  const stripLook = useMemo(() => thumbLook(look), [look]);
  if (!sl) return null;
  const fit = p.zoom === "fit";
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-zinc-50">
      <PresenterToolbar index={i} total={n} />
      <div className="flex min-h-0 flex-1 gap-4 px-4 pb-4">
        <div className={cn("relative flex min-w-0 flex-1 overflow-auto", fit ? "items-center justify-center" : "items-start justify-start")}>
          <div
            className="relative"
            style={{ width: fit ? `min(100%, calc((100vh - ${p.strip ? 230 : 90}px) * 1.7778))` : p.zoom, cursor: p.laser ? "none" : "default" }}
            onMouseMove={(e) => {
              if (!p.laser) return;
              const r = e.currentTarget.getBoundingClientRect();
              setLaserAt({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
            }}
            onMouseLeave={() => setLaserAt(null)}
          >
            <div key={i} style={{ animation: transitionCss(tr, ".55s") }}>
              <SlideView slide={sl} index={i} total={n} look={look} opts={opts} />
            </div>
            <InkCanvas />
            {p.laser && laserAt && (
              <span className="pointer-events-none absolute size-3.5 -translate-1/2 rounded-full bg-red-500" style={{ left: `${laserAt.x}%`, top: `${laserAt.y}%`, animation: "laser 1.2s ease-in-out infinite" }} />
            )}
            {p.black && <div className="absolute inset-0 rounded-[inherit] bg-black" />}
          </div>
        </div>
        <PresenterSide index={i} />
      </div>
      {p.strip && (
        <div className="flex h-28 shrink-0 gap-3 overflow-x-auto border-t border-zinc-900 px-4 py-2">
          {deck.slides.map((s, k) => (
            <button key={k} type="button" onClick={() => p.goTo(k)} className="flex w-36 shrink-0 flex-col gap-1" style={{ opacity: k === i ? 1 : 0.6 }}>
              <div className={cn("rounded-md", k === i ? "ring-2 ring-blue-500" : "ring-1 ring-zinc-800")}>
                <SlideView slide={s} index={k} total={n} look={stripLook} />
              </div>
              <span className="font-mono text-[10px] text-zinc-500">{slideNumber(s, k)}</span>
            </button>
          ))}
        </div>
      )}
      {p.overview && <OverviewGrid current={i} />}
      <ShareDialog />
    </div>
  );
}
