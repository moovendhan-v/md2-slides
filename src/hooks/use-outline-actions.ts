"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { addSlide, appendSegment, moveSegment, moveSlide, removeSegment, removeSlide, setSegmentText, setSlideText } from "@/domain/source/outline-edit";
import { useWorkspace } from "@/stores/workspace";

/**
 * Structural edits used by the Blocks view (drag to reorder slides and
 * components, edit their raw Markdown). Thin wrappers over the pure
 * transforms in `domain/source/outline-edit`.
 */
export function useOutlineActions() {
  return useMemo(() => {
    const change = (fn: (src: string) => string) => {
      const ws = useWorkspace.getState();
      const src = ws.files[ws.activeKey] ?? "";
      const next = fn(src);
      if (next !== src) ws.setSource(next);
      return next !== src;
    };
    return {
      moveSlide: (from: number, to: number) => change((s) => moveSlide(s, from, to)) && toast(`Slide ${from + 1} moved to ${to + 1}`),
      moveSegment: (from: number, seg: number, to: number, at: number) => change((s) => moveSegment(s, from, seg, to, at)),
      setSegment: (slide: number, seg: number, text: string) => change((s) => setSegmentText(s, slide, seg, text)),
      removeSegment: (slide: number, seg: number) => change((s) => removeSegment(s, slide, seg)) && toast("Component deleted"),
      appendSegment: (slide: number, md: string) => change((s) => appendSegment(s, slide, md)),
      setSlide: (slide: number, text: string) => change((s) => setSlideText(s, slide, text)),
      removeSlide: (slide: number) => change((s) => removeSlide(s, slide)) && toast(`Slide ${slide + 1} deleted`),
      addSlide: () => change((s) => addSlide(s, "## New slide")),
    };
  }, []);
}

export type OutlineActions = ReturnType<typeof useOutlineActions>;
