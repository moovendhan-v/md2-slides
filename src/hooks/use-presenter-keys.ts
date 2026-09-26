"use client";

import { useEffect } from "react";
import { useDeck } from "@/app-shell/deck-context";
import { clickCount } from "@/domain/deck/queries";
import { usePresent } from "@/stores/present";
import { useUi } from "@/stores/ui";

export const isTyping = (t: EventTarget | null) => /INPUT|TEXTAREA|SELECT/.test((t as HTMLElement | null)?.tagName ?? "");

export function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen?.().catch(() => undefined);
}

type Slides = ReturnType<typeof useDeck>["deck"]["slides"];
type Options = ReturnType<typeof useDeck>["options"];

/** Step helper shared by the presenter's keys and on-screen buttons (click reveals first, then slides). */
export function presenterStep(dir: 1 | -1, slides: Slides, options: Options) {
  const p = usePresent.getState();
  const clicks = clickCount(slides[p.index], options);
  if (dir > 0) {
    if (p.click < clicks) p.set({ click: p.click + 1 });
    else if (p.index < slides.length - 1) p.goTo(p.index + 1);
  } else if (p.click > 0) p.set({ click: p.click - 1 });
  else if (p.index > 0) p.goTo(p.index - 1, clickCount(slides[p.index - 1], options));
}

/**
 * Presenter shortcuts (arrows / space, O D C L B F T Z, Esc) while presenting.
 * Used by the editor and by the read-only share viewer / HTML export.
 */
export function usePresenterKeys() {
  const { deck, options } = useDeck();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const p = usePresent.getState();
      if (!p.active || useUi.getState().modal || isTyping(e.target) || e.metaKey || e.ctrlKey) return;
      if (e.key === "Escape") return p.overview ? p.set({ overview: false }) : p.stop();
      const step = (dir: 1 | -1) => presenterStep(dir, deck.slides, options);
      if (["ArrowRight", " ", "PageDown"].includes(e.key)) {
        e.preventDefault();
        return step(1);
      }
      if (["ArrowLeft", "PageUp"].includes(e.key)) {
        e.preventDefault();
        return step(-1);
      }
      const toggles: Record<string, () => void> = {
        o: () => p.set({ overview: !p.overview }),
        d: () => p.set({ pen: !p.pen, laser: false }),
        c: () => p.set({ inkClear: p.inkClear + 1 }),
        l: () => p.set({ laser: !p.laser, pen: false }),
        b: () => p.set({ black: !p.black }),
        f: toggleFullscreen,
        t: () => p.set({ strip: !p.strip }),
        z: () => p.cycleZoom(),
      };
      toggles[e.key.toLowerCase()]?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deck, options]);
}
