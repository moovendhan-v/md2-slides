"use client";

import { useEffect } from "react";
import { useDeck } from "@/app-shell/deck-context";
import { clickCount } from "@/domain/deck/queries";
import { usePushChanges } from "@/features/commit/use-push-changes";
import { useEditor } from "@/stores/editor";
import { pref, useSession } from "@/stores/session";
import { usePresent } from "@/stores/present";
import { useUi } from "@/stores/ui";

const isTyping = (t: EventTarget | null) => /INPUT|TEXTAREA|SELECT/.test((t as HTMLElement | null)?.tagName ?? "");

export function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen?.().catch(() => undefined);
}

/** App-wide shortcuts: ⌘K palette, ⌘S commit, ⌘↵ present, presenter keys, Esc. */
export function useGlobalKeys() {
  const { deck, options, current } = useDeck();
  const { push } = usePushChanges();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const ui = useUi.getState();
      const p = usePresent.getState();
      const k = e.key.toLowerCase();
      if (mod && k === "k") {
        e.preventDefault();
        return ui.modal === "palette" ? ui.closeModal() : ui.openModal("palette");
      }
      if (mod && k === "s") {
        e.preventDefault();
        if (pref(useSession.getState().prefs, "autoCommit", false)) return void push();
        return ui.openModal("commit");
      }
      if (mod && e.key === "Enter") {
        e.preventDefault();
        if (deck.slides.length) p.start(current);
        return;
      }
      if (e.key === "Escape") {
        if (ui.modal) return; // dialogs close themselves
        useEditor.getState().set({ pick: null, insertOpen: false, syntaxOpen: false, transitionPick: null });
        if (p.active && p.overview) p.set({ overview: false });
        else if (p.active) p.stop();
        return;
      }
      if (!p.active || ui.modal || isTyping(e.target)) return;
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
      toggles[k]?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deck, options, current, push]);
}

/** Step helper shared by the presenter's on-screen buttons. */
export function presenterStep(dir: 1 | -1, slides: ReturnType<typeof useDeck>["deck"]["slides"], options: ReturnType<typeof useDeck>["options"]) {
  const p = usePresent.getState();
  const clicks = clickCount(slides[p.index], options);
  if (dir > 0) {
    if (p.click < clicks) p.set({ click: p.click + 1 });
    else if (p.index < slides.length - 1) p.goTo(p.index + 1);
  } else if (p.click > 0) p.set({ click: p.click - 1 });
  else if (p.index > 0) p.goTo(p.index - 1, clickCount(slides[p.index - 1], options));
}
