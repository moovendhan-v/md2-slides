"use client";

import { useDeck } from "@/app-shell/deck-context";
import { Icon } from "@/components/common/icon";
import { useEditor } from "@/stores/editor";

const SEV = {
  error: ["x-circle", "text-red-400"],
  warn: ["warning", "text-amber-400"],
  info: ["info", "text-blue-400"],
} as const;

/** Collapsible problems list + caret position, like an IDE status bar. */
export function ProblemsBar() {
  const { deck, current } = useDeck();
  const { problemsOpen, curLine, set, jumpTo } = useEditor();
  const errs = deck.problems.filter((p) => p.sev === "error").length;
  const warns = deck.problems.length - errs;
  return (
    <div className="shrink-0 border-t border-zinc-800 bg-zinc-950">
      {problemsOpen && (
        <div className="max-h-40 overflow-auto py-1">
          {deck.problems.length === 0 ? (
            <p className="px-4 py-2 text-xs text-zinc-500">No problems — the deck parses cleanly.</p>
          ) : (
            deck.problems.map((p, i) => (
              <button key={i} type="button" onClick={() => jumpTo(p.line)} className="flex w-full items-center gap-2 px-4 py-1 text-left text-xs hover:bg-zinc-900">
                <Icon name={SEV[p.sev][0]} className={SEV[p.sev][1]} />
                <span className="flex-1 text-zinc-300">{p.msg}</span>
                <span className="font-mono text-zinc-500">Ln {p.line + 1}</span>
              </button>
            ))
          )}
        </div>
      )}
      <button type="button" onClick={() => set({ problemsOpen: !problemsOpen })} className="flex h-8 w-full items-center gap-3 px-3 text-xs text-zinc-400 hover:bg-zinc-900/50">
        <Icon name={problemsOpen ? "caret-down" : "caret-up"} />
        <span className={errs ? "text-red-400" : "text-zinc-500"}>
          <Icon name="x-circle" /> {errs}
        </span>
        <span className={warns ? "text-amber-400" : "text-zinc-500"}>
          <Icon name="warning" /> {warns}
        </span>
        <span>Problems</span>
        <span className="ml-auto font-mono text-zinc-500">
          Ln {curLine + 1} · slide {current + 1}
        </span>
      </button>
    </div>
  );
}
