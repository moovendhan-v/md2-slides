"use client";

import { useCallback, useRef } from "react";
import { toast } from "sonner";
import type { AiPreset } from "@/data";
import { stripFrontMatter } from "@/domain/source/frontmatter";
import { useServices } from "@/app-shell/services";
import { useEngine } from "@/engine/provider";
import { useDeckActions } from "@/hooks/use-deck-actions";
import { useFileActions } from "@/hooks/use-file-actions";
import { useAi } from "@/stores/ai";
import { useUi } from "@/stores/ui";
import { useWorkspace } from "@/stores/workspace";
import { useDeck } from "@/app-shell/deck-context";
import { getSlideContext, getDeckOutline } from "@/services/local-ai/prompts/context";

export const AI_STEPS = [
  "Preparing context & syntax",
  "Generating with language model",
  "Streaming tokens",
  "Validating with WASM engine",
  "Ready to apply",
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Drives the AI dialog: request → streaming reveal → Wasm validation → apply. */
export function useAiGenerate() {
  const { ai } = useServices();
  const engine = useEngine();
  const deckActions = useDeckActions();
  const files = useFileActions();
  const activeDeck = useDeck();
  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (preset?: AiPreset) => {
      const st = useAi.getState();
      const prompt = preset ? preset.prompt : st.prompt.trim();
      const isImproveTask = st.task === "improve" || st.task === "notes" || st.task === "summarize";

      if (!prompt && !isImproveTask) {
        return st.set({ error: "Describe what you want to create first, or pick a preset." });
      }

      const run = st.runId + 1;
      const alive = () => useAi.getState().runId === run;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      st.set({
        runId: run,
        phase: "busy",
        step: 0,
        error: "",
        prompt: prompt || (isImproveTask ? `Current Slide (${st.task})` : ""),
        typed: "",
      });

      await wait(150);
      if (!alive()) return;

      // Extract slide/deck context if relevant
      let currentSlideContent = "";
      let deckOutlineContext = "";
      if (activeDeck.deck.slides.length > 0) {
        const slide = activeDeck.deck.slides[activeDeck.current];
        if (slide) {
          currentSlideContent = getSlideContext(slide);
        }
        deckOutlineContext = getDeckOutline(activeDeck.deck);
      }

      useAi.getState().set({ step: 1 });

      let draft;
      try {
        draft = await ai.generate(prompt || "Process slide", {
          slides: st.count,
          provider: st.provider,
          modelId: st.localModelId,
          task: st.task,
          slideContent: currentSlideContent,
          context: deckOutlineContext,
          instruction: st.improveMode === "custom" ? st.customInstruction : st.improveMode,
          signal: controller.signal,
          onToken: (fullText) => {
            if (alive()) {
              useAi.getState().set({ typed: fullText, step: 2 });
            }
          },
        });
      } catch (e) {
        if (!alive() || controller.signal.aborted) return;
        return useAi.getState().set({ phase: "idle", error: (e as Error).message });
      }

      if (!alive() || controller.signal.aborted) return;

      const md = draft.markdown.trim() + "\n";
      useAi.getState().set({ step: 3, typed: md });

      // Run WASM engine validation
      const parsed = engine.parse(md);
      const errs = parsed.problems.filter((p) => p.sev === "error").length;

      useAi.getState().set({ step: 4 });
      await wait(200);
      if (!alive()) return;

      const speedInfo = draft.stats?.tokensPerSecond ? ` · ${draft.stats.tokensPerSecond} tok/s` : "";
      const slideCount = parsed.slides.length || (st.task === "deck" ? 0 : 1);
      const summary = `${slideCount} slide${slideCount === 1 ? "" : "s"} · ${
        errs ? `${errs} syntax error(s)` : "valid syntax"
      } · ${draft.provider}${draft.model ? ` (${draft.model})` : ""}${speedInfo}`;

      useAi.getState().set({
        phase: "done",
        markdown: md,
        summary,
        seed: useAi.getState().seed + 1,
        tokensPerSecond: draft.stats?.tokensPerSecond,
        totalTokens: draft.stats?.totalTokens,
      });
    },
    [ai, engine, activeDeck],
  );

  const apply = useCallback(() => {
    const { markdown, target, task } = useAi.getState();
    const close = () => useUi.getState().closeModal();

    if (task === "notes") {
      // Append speaker notes to current slide
      const cleanedNotes = markdown.replace(/^(\?\?\?\n?|#.*?\n)/gm, "").trim();
      deckActions.setDirective("notes", cleanedNotes);
      close();
      return toast("Added AI speaker notes to current slide");
    }

    if (task === "slide") {
      deckActions.insertSlide(stripFrontMatter(markdown));
      close();
      return toast("Inserted new AI slide");
    }

    if (target === "insert") {
      deckActions.appendSlides(stripFrontMatter(markdown));
      close();
      return toast("Added AI slides to the end of this deck");
    }

    if (target === "replace") {
      useWorkspace.getState().setSource(markdown);
      close();
      return toast("Replaced deck with AI draft — the commit dialog shows the diff");
    }

    const meta = engine.parse(markdown).meta;
    const id =
      (meta.title || "ai-deck")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "ai-deck";
    const look: Record<string, string> = { ...meta };
    delete look.title;
    files.createFromTemplate({
      id,
      name: meta.title || "AI deck",
      look,
      md: stripFrontMatter(markdown).trim(),
    });
    close();
  }, [deckActions, files, engine]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    useAi.getState().set({ runId: useAi.getState().runId + 1, phase: "idle" });
  }, []);

  return { generate, apply, cancel };
}
