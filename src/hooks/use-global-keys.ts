"use client";

import { useEffect } from "react";
import { useDeck } from "@/app-shell/deck-context";
import { usePushChanges } from "@/features/commit/use-push-changes";
import { useEditor } from "@/stores/editor";
import { pref, useSession } from "@/stores/session";
import { usePresent } from "@/stores/present";
import { useUi } from "@/stores/ui";
import { usePresenterKeys } from "./use-presenter-keys";

/** App-wide shortcuts: ⌘K palette, ⌘S commit, ⌘↵ present, Esc — plus the presenter keys. */
export function useGlobalKeys() {
  const { deck, current } = useDeck();
  const { push } = usePushChanges();
  usePresenterKeys();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const ui = useUi.getState();
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
        if (deck.slides.length) usePresent.getState().start(current);
        return;
      }
      if (e.key === "Escape" && !ui.modal) useEditor.getState().set({ pick: null, insertOpen: false, syntaxOpen: false, transitionPick: null });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deck, current, push]);
}
