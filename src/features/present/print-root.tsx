"use client";

import { useDeck } from "@/app-shell/deck-context";
import { SlideView } from "@/components/slide/slide-view";

/** Off-screen render of every slide; the print stylesheet shows only this. */
export function PrintRoot() {
  const { deck, look } = useDeck();
  return (
    <div data-print-root className="pointer-events-none fixed top-0 left-[-10000px] w-[1200px]">
      {deck.slides.map((s, i) => (
        <div key={i} data-pg style={{ width: "100vw", maxWidth: 1200 }}>
          <SlideView slide={s} index={i} total={deck.slides.length} look={look} />
        </div>
      ))}
    </div>
  );
}
