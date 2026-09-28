"use client";

import { Icon } from "@/components/common/icon";
import { cn } from "@/lib/utils";
import { useAi, type ImproveMode } from "@/stores/ai";
import type { AiTaskType } from "@/services/ai/types";
import { useDeck } from "@/app-shell/deck-context";

const TASKS: Array<{ id: AiTaskType; label: string; icon: string; desc: string }> = [
  { id: "deck", label: "Full Deck", icon: "presentation", desc: "Generate a complete multi-slide deck" },
  { id: "slide", label: "Single Slide", icon: "file-plus", desc: "Add a slide on a specific topic" },
  { id: "improve", label: "Improve", icon: "sparkle", desc: "Refine or rewrite current slide" },
  { id: "notes", label: "Speaker Notes", icon: "microphone", desc: "Write talking points for current slide" },
  { id: "summarize", label: "Summarize", icon: "list-bullets", desc: "Condense slide to 3 key bullet points" },
];

const IMPROVE_MODES: Array<{ id: ImproveMode; label: string }> = [
  { id: "concise", label: "More concise" },
  { id: "impactful", label: "More impactful" },
  { id: "professional", label: "Executive / Professional" },
  { id: "visual", label: "Visual (Cards & Callouts)" },
  { id: "custom", label: "Custom instruction" },
];

export function LocalAIGeneration() {
  const task = useAi((s) => s.task);
  const improveMode = useAi((s) => s.improveMode);
  const customInstruction = useAi((s) => s.customInstruction);
  const setAi = useAi((s) => s.set);
  const activeDeck = useDeck();
  const currentSlideIndex = activeDeck.current ?? 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {TASKS.map((t) => {
          const active = task === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setAi({ task: t.id })}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap",
                active
                  ? "bg-violet-600 text-white shadow-sm"
                  : "bg-zinc-900/70 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800",
              )}
            >
              <Icon name={t.icon} />
              {t.label}
            </button>
          );
        })}
      </div>

      {task === "improve" && (
        <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/30 p-2.5">
          <span className="text-[11px] font-medium text-zinc-400">
            Slide {currentSlideIndex + 1} Target Style:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {IMPROVE_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setAi({ improveMode: m.id })}
                className={cn(
                  "rounded px-2 py-1 text-[11px] transition-colors",
                  improveMode === m.id
                    ? "bg-violet-950 text-violet-200 border border-violet-700"
                    : "bg-zinc-800/60 text-zinc-400 hover:text-zinc-200",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
          {improveMode === "custom" && (
            <input
              type="text"
              value={customInstruction}
              onChange={(e) => setAi({ customInstruction: e.target.value })}
              placeholder="e.g. Rewrite for junior developers with step-by-step clarity"
              className="mt-1 rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
            />
          )}
        </div>
      )}

      {(task === "notes" || task === "summarize") && (
        <div className="rounded border border-zinc-800/80 bg-zinc-900/20 px-2.5 py-1.5 text-[11px] text-zinc-400">
          Targeting active <strong className="text-zinc-200">Slide {currentSlideIndex + 1}</strong>.
        </div>
      )}
    </div>
  );
}
