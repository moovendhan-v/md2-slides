"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import type { Block } from "@/engine/types";
import type { TransformTarget } from "@/domain/deck/constants";
import { slideFocusLine } from "@/domain/deck/queries";
import { duplicateBlock, insertAtOffset, removeBlock, setFenceArg, setImageArg, setImageSrc, setRowIcon, setVariant } from "@/domain/source/blocks";
import { setDirective, setLayout, setLayoutImage } from "@/domain/source/directives";
import { writeMeta } from "@/domain/source/frontmatter";
import { appendSlides, deleteSlide, duplicateSlide, formatSource, insertAtLine, insertSlideAfter } from "@/domain/source/slides";
import { transformBlock } from "@/domain/source/transform";
import { useDeck } from "@/app-shell/deck-context";
import { useEditor } from "@/stores/editor";
import { usePresent } from "@/stores/present";
import { useUi } from "@/stores/ui";
import { useWorkspace } from "@/stores/workspace";

/**
 * Every edit the UI can make to the active deck. Each action is a pure source
 * transform from `src/domain/source` applied to the workspace store, so the
 * toolbar, palette, preview and customizer all share one implementation.
 */
export function useDeckActions() {
  const active = useDeck();
  return useMemo(() => {
    const ws = () => useWorkspace.getState();
    const src = () => ws().files[ws().activeKey] ?? "";
    const apply = (next: string) => ws().setSource(next);
    const editor = useEditor.getState;
    const slideAt = (i?: number) => active.deck.slides[i ?? active.current];
    /** Display index (parts included) → authored slide index. */
    const srcIndex = (i: number) => active.deck.slides[i]?.sourceIndex ?? i;
    const focus = (line: number) => setTimeout(() => editor().jumpTo(line), 30);

    return {
      setOption: (key: string, value: string | number | boolean) => apply(writeMeta(src(), key, String(value))),
      setDirective: (key: string, value: string | null, index?: number) => {
        const sl = slideAt(index);
        if (sl) apply(setDirective(src(), sl, key, value));
      },
      setLayout: (layout: string) => {
        const sl = slideAt();
        if (sl) apply(setLayout(src(), sl, layout));
      },
      setLayoutImage: (url: string) => {
        const sl = slideAt();
        if (sl) apply(setLayoutImage(src(), sl, url));
      },
      resetSlide: () => {
        const sl = slideAt();
        if (!sl) return;
        let s = src();
        for (const k of ["bg", "color", "titleColor", "accent", "align", "titleSize", "pad", "transition", "animate", "zoom"]) s = setDirective(s, sl, k, null);
        apply(s);
      },
      duplicateSlide: (i: number) => {
        const k = srcIndex(i);
        apply(duplicateSlide(src(), active.source, k));
        toast(`Slide ${k + 1} duplicated`);
      },
      deleteSlide: (i: number) => {
        const k = srcIndex(i);
        const next = deleteSlide(src(), active.source, k);
        if (next === src()) return;
        apply(next);
        toast(`Slide ${k + 1} deleted`);
      },
      insertSlide: (md: string) => {
        const r = insertSlideAfter(src(), active.source, srcIndex(active.current), md);
        apply(r.src);
        useUi.getState().closeModal();
        focus(r.focus);
      },
      insertAtCursor: (md: string) => {
        const r = insertAtLine(src(), editor().curLine, md);
        apply(r.src);
        editor().set({ insertOpen: false });
        useUi.getState().closeModal();
        focus(r.focus);
      },
      appendSlides: (md: string) => apply(appendSlides(src(), md)),
      format: () => {
        apply(formatSource(src()));
        toast("Formatted · trailing space and blank lines cleaned");
      },
      jumpToSlide: (i: number) => {
        const sl = active.deck.slides[i];
        if (sl) editor().jumpTo(slideFocusLine(sl));
      },
      pickBlock: (chunk: Block) => {
        const b = chunk.source ?? chunk;
        editor().set({ pick: b.mermaid ? null : b });
        editor().jumpTo(b.line);
      },
      setVariant: (b: Block, v: string) => {
        apply(setVariant(src(), b, v));
        editor().set({ pick: null });
        toast(`${b.type === "callout" ? "Callout" : b.type} → ${v}`);
      },
      setFenceArg: (b: Block, key: string, v: string) => {
        apply(setFenceArg(src(), b.line, key, v));
        editor().set({ pick: { ...b, args: { ...b.args, [key]: v } } });
      },
      setRowIcon: (b: Block, row: number, icon: string) => {
        const target = b.source ?? b;
        apply(setRowIcon(src(), target, row, icon));
        const rows = target.rows?.map((r, k) => (k !== row ? r : r.includes("|") ? r.replace(/^[^|]*/, `${icon} `) : `${icon} | ${r}`));
        if (editor().pick) editor().set({ pick: { ...target, rows } });
      },
      /** Insert inline text (e.g. `:rocket:`) at the editor caret. */
      insertInline: (text: string) => {
        const at = editor().caret;
        apply(insertAtOffset(src(), at, text));
        editor().set({ caret: at + text.length });
        toast(`Inserted ${text}`);
      },
      setImageArg: (line: number, key: string, v: string) => apply(setImageArg(src(), line, key, v)),
      setImageSrc: (line: number, url: string) => apply(setImageSrc(src(), line, url)),
      transformBlock: (b: Block, to: TransformTarget) => {
        apply(transformBlock(src(), b, to));
        editor().set({ pick: null });
        toast(`Transformed ${b.type} → ${to}`);
      },
      duplicateBlock: (b: Block) => {
        apply(duplicateBlock(src(), b));
        editor().set({ pick: null });
        toast("Block duplicated");
      },
      removeBlock: (b: Block) => {
        apply(removeBlock(src(), b));
        editor().set({ pick: null });
        toast("Block deleted");
      },
      present: (from?: number, overview = false) => {
        useUi.getState().closeModal();
        if (!active.deck.slides.length) return toast("Open a deck with at least one slide to present");
        usePresent.getState().start(from ?? active.current, overview);
      },
    };
  }, [active]);
}

export type DeckActions = ReturnType<typeof useDeckActions>;
