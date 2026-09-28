"use client";

import { useMemo } from "react";
import { AI_PRESETS } from "@/data";
import { buildLook, deckOptions, thumbLook } from "@/domain/deck/look";
import { Seg } from "@/components/common/controls";
import { Icon } from "@/components/common/icon";
import { SlideView } from "@/components/slide/slide-view";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useEngine } from "@/engine/provider";
import { cn } from "@/lib/utils";
import { useAi, type AiTarget } from "@/stores/ai";
import { useUi } from "@/stores/ui";
import { AI_STEPS, useAiGenerate } from "./use-ai-generate";
import { AiStatus } from "./ai-status";
import { AIProviderSelector } from "./AIProviderSelector";
import { ModelDownload } from "./ModelDownload";
import { LocalAIGeneration } from "./LocalAIGeneration";

function Progress() {
  const { step, typed, tokensPerSecond } = useAi();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 text-[13px]">
          {AI_STEPS.map((label, i) => (
            <div
              key={label}
              className={cn(
                "flex items-center gap-1.5 text-xs",
                i <= step ? "text-zinc-100 font-medium" : "text-zinc-500 opacity-60",
              )}
            >
              <span
                className={cn(
                  "grid size-4 place-items-center rounded-full text-[10px]",
                  i < step
                    ? "bg-emerald-400 text-zinc-950 font-bold"
                    : i === step
                    ? "bg-violet-500 text-white"
                    : "bg-zinc-800 text-zinc-400",
                )}
              >
                <Icon
                  name={i < step ? "check" : i === step ? "circle-notch" : "dot"}
                  className={i === step ? "animate-spin" : ""}
                />
              </span>
              {label}
            </div>
          ))}
        </div>
        {tokensPerSecond && (
          <span className="font-mono text-xs text-violet-400 font-medium">
            {tokensPerSecond} tok/s
          </span>
        )}
      </div>
      <pre className="h-48 overflow-y-auto rounded-lg bg-zinc-900/80 p-3 font-mono text-[11px] leading-4 whitespace-pre-wrap text-zinc-300 border border-zinc-800">
        {typed || "Initializing language model runtime..."}
      </pre>
    </div>
  );
}

function Result() {
  const engine = useEngine();
  const { markdown, summary, seed } = useAi();
  const { deck, look } = useMemo(() => {
    const d = engine.parse(markdown);
    return { deck: d, look: thumbLook(buildLook(deckOptions(d.meta))) };
  }, [engine, markdown]);

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <p className="text-xs font-medium text-emerald-400">{summary}</p>
      <div className="grid max-h-[46vh] grid-cols-2 gap-3 overflow-y-auto pr-1">
        {deck.slides.map((s, i) => (
          <div key={`${seed}-${i}`} style={{ animation: `tr-zoom .5s cubic-bezier(.2,.7,.2,1) ${i * 90}ms both` }}>
            <SlideView slide={s} index={i} total={deck.slides.length} look={look} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Generate or edit slides using Local SLM (browser WebGPU) or Remote AI. */
export function AiDialog() {
  const open = useUi((s) => s.modal === "ai");
  const close = useUi((s) => s.closeModal);
  const st = useAi();
  const { generate, apply, cancel } = useAiGenerate();

  const applyLabel = {
    new: "Create new deck",
    insert: "Append to deck",
    replace: "Replace deck",
  }[st.target];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) return;
        cancel();
        close();
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto border-zinc-800 bg-zinc-950 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="sparkle" className="text-violet-400" /> AI Slide Assistant
          </DialogTitle>
          <DialogDescription>
            Generate and refine slides with local browser SLMs or remote cloud endpoints.
          </DialogDescription>
        </DialogHeader>

        {st.phase === "idle" && (
          <div className="flex flex-col gap-4">
            <AIProviderSelector />

            {st.provider === "local" ? (
              <>
                <ModelDownload />
                <LocalAIGeneration />
              </>
            ) : (
              <AiStatus enabled={open} />
            )}

            {st.task !== "notes" && st.task !== "summarize" && (
              <Textarea
                value={st.prompt}
                onChange={(e) => st.set({ prompt: e.target.value, error: "" })}
                placeholder={
                  st.task === "slide"
                    ? "e.g. A slide explaining zero-copy buffers in Rust"
                    : st.task === "improve"
                    ? "e.g. Focus on memory safety and concurrency benefits"
                    : "e.g. A 10-minute talk on our migration from REST to gRPC, for engineers"
                }
                className="min-h-24 border-zinc-800 text-[13px]"
              />
            )}

            {st.task === "deck" && (
              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-2">
                  Slides{" "}
                  <Seg
                    size="sm"
                    value={st.count}
                    onChange={(count) => st.set({ count })}
                    options={[3, 4, 6, 8, 12].map((id) => ({ id, label: String(id) }))}
                  />
                </span>
                <span className="flex items-center gap-2">
                  Output
                  <Seg<AiTarget>
                    size="sm"
                    value={st.target}
                    onChange={(target) => st.set({ target })}
                    options={[
                      { id: "new", label: "New file" },
                      { id: "insert", label: "Append" },
                      { id: "replace", label: "Replace" },
                    ]}
                  />
                </span>
              </div>
            )}

            {st.task === "deck" && (
              <div className="flex flex-wrap gap-2">
                {AI_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => generate(p)}
                    className="flex items-center gap-1.5 rounded-full border border-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-600 transition-colors"
                  >
                    <Icon name={p.icon} /> {p.label}
                  </button>
                ))}
              </div>
            )}

            {st.error && <p className="text-xs text-amber-400">{st.error}</p>}

            <Button
              className="gap-1.5 self-end bg-violet-600 font-semibold text-white hover:bg-violet-500 shadow-md"
              onClick={() => generate()}
            >
              <Icon name="sparkle" />{" "}
              {st.task === "deck"
                ? "Generate Deck"
                : st.task === "slide"
                ? "Generate Slide"
                : st.task === "improve"
                ? "Improve Slide"
                : st.task === "notes"
                ? "Generate Speaker Notes"
                : "Summarize Slide"}
            </Button>
          </div>
        )}

        {st.phase === "busy" && (
          <>
            <Progress />
            <Button variant="outline" className="self-end border-zinc-800 text-xs" onClick={cancel}>
              Cancel Generation
            </Button>
          </>
        )}

        {st.phase === "done" && (
          <>
            {st.error && <p className="text-xs text-amber-400">{st.error}</p>}
            <Result />
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="border-zinc-800" onClick={() => st.set({ phase: "idle" })}>
                Back
              </Button>
              <Button
                className="bg-zinc-50 font-semibold text-zinc-950 hover:bg-zinc-200"
                onClick={apply}
              >
                {st.task === "notes"
                  ? "Attach Speaker Notes"
                  : st.task === "slide"
                  ? "Insert Slide"
                  : applyLabel}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
