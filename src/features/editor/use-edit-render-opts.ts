"use client";

import { useMemo } from "react";
import type { SlideRenderOptions } from "@/components/slide/render-context";
import { useDeckActions } from "@/hooks/use-deck-actions";
import { useEditor } from "@/stores/editor";
import { useUi } from "@/stores/ui";

/** Interactive render options for slides shown in the editor preview. */
export function useEditRenderOpts(animate = false, seed = 0): SlideRenderOptions {
  const actions = useDeckActions();
  const selectedLine = useEditor((s) => s.pick?.line ?? -1);
  return useMemo(
    () => ({
      edit: true,
      selectedLine,
      onPick: actions.pickBlock,
      onJump: (line: number) => useEditor.getState().jumpTo(line),
      onMedia: (i: number) => {
        actions.jumpToSlide(i);
        useUi.getState().set({ customOpen: true, customTab: "slide" });
      },
      animate,
      seed,
    }),
    [actions, selectedLine, animate, seed],
  );
}
