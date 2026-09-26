"use client";

import { SYNTAX } from "@/domain/deck/constants";
import { Icon } from "@/components/common/icon";
import { useEditor } from "@/stores/editor";

/** Slide-over cheat sheet of the deck syntax. */
export function SyntaxPanel() {
  const { syntaxOpen, set } = useEditor();
  if (!syntaxOpen) return null;
  return (
    <div className="absolute inset-y-0 left-0 z-20 flex w-[min(420px,100%)] flex-col border-r border-zinc-800 bg-zinc-950/95 shadow-2xl backdrop-blur">
      <div className="flex h-10 items-center justify-between border-b border-zinc-800 px-4">
        <span className="text-[13px] font-medium">Syntax reference</span>
        <button type="button" onClick={() => set({ syntaxOpen: false })} className="text-zinc-500 hover:text-zinc-100" aria-label="Close">
          <Icon name="x" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {SYNTAX.map(([code, desc]) => (
          <div key={code} className="border-b border-zinc-900 py-2">
            <code className="font-mono text-xs text-violet-300">{code}</code>
            <p className="mt-0.5 text-xs text-zinc-400">{desc}</p>
          </div>
        ))}
        <a href="/llms-full.txt" target="_blank" className="mt-3 inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
          <Icon name="book-open" /> Full syntax (llms-full.txt)
        </a>
      </div>
    </div>
  );
}
