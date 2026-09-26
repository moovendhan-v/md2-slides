"use client";

import { useMemo } from "react";
import { BLOCK_SNIPPETS } from "@/data";
import { thumbLook } from "@/domain/deck/look";
import { useDeck } from "@/app-shell/deck-context";
import { Icon } from "@/components/common/icon";
import { SlideView } from "@/components/slide/slide-view";
import { Button } from "@/components/ui/button";
import { useEngine } from "@/engine/provider";
import { useDeckActions } from "@/hooks/use-deck-actions";
import { cn } from "@/lib/utils";
import { useEditor } from "@/stores/editor";
import { useUi } from "@/stores/ui";

/** "/" block inserter: grouped snippet list with a live rendered preview. */
export function InsertMenu() {
  const engine = useEngine();
  const { look } = useDeck();
  const { insertOpen, insertAt, snipHover, set } = useEditor();
  const width = useUi((s) => s.width);
  const actions = useDeckActions();
  const groups = useMemo(() => {
    const g: { cat: string; items: { i: number; label: string; icon: string }[] }[] = [];
    BLOCK_SNIPPETS.forEach((s, i) => {
      let G = g.find((x) => x.cat === s.cat);
      if (!G) g.push((G = { cat: s.cat, items: [] }));
      G.items.push({ i, label: s.label, icon: s.icon || "cube" });
    });
    return g;
  }, []);
  const snip = BLOCK_SNIPPETS[snipHover] ?? BLOCK_SNIPPETS[0];
  const preview = useMemo(() => engine.parse(`# ${snip.label}\n${snip.md}`).slides[0], [engine, snip]);
  if (!insertOpen) return null;
  const w = Math.min(640, width - 24);
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => set({ insertOpen: false })} />
      <div
        className="fixed z-50 flex h-[380px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        style={{ left: Math.max(12, Math.min(insertAt.x, width - w - 12)), top: Math.min(insertAt.y, window.innerHeight - 392), width: w }}
      >
        <div className="w-56 shrink-0 overflow-y-auto border-r border-zinc-800 py-1.5">
          {groups.map((g) => (
            <div key={g.cat}>
              <div className="px-3 pt-2 pb-1 text-[10px] tracking-wider text-zinc-500 uppercase">{g.cat}</div>
              {g.items.map((it) => (
                <button
                  key={it.i}
                  type="button"
                  onMouseEnter={() => set({ snipHover: it.i })}
                  onClick={() => actions.insertAtCursor(BLOCK_SNIPPETS[it.i].md)}
                  className={cn("flex h-7 w-full items-center gap-2 px-3 text-left text-[13px] text-zinc-300", it.i === snipHover && "bg-zinc-800/70 text-zinc-50")}
                >
                  <Icon name={it.icon} className="text-zinc-400" />
                  {it.label}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-3">
          {preview && <SlideView slide={preview} index={0} total={1} look={thumbLook(look)} />}
          <pre className="min-h-0 flex-1 overflow-auto rounded-md bg-zinc-900/70 p-2 font-mono text-[11px] leading-4 text-zinc-400">{snip.md}</pre>
          <Button size="sm" className="self-end bg-zinc-50 text-zinc-950 hover:bg-zinc-200" onClick={() => actions.insertAtCursor(snip.md)}>
            Insert {snip.label} <span className="ml-1 text-zinc-500">↵</span>
          </Button>
        </div>
      </div>
    </>
  );
}
