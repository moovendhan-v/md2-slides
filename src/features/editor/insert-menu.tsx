"use client";

import { useMemo, useState } from "react";
import { BLOCK_SNIPPETS } from "@/data";
import { thumbLook } from "@/domain/deck/look";
import { searchSnippets } from "@/domain/deck/snippet-search";
import { useDeck } from "@/app-shell/deck-context";
import { Icon } from "@/components/common/icon";
import { SlideView } from "@/components/slide/slide-view";
import { Button } from "@/components/ui/button";
import { useEngine } from "@/engine/provider";
import { useDeckActions } from "@/hooks/use-deck-actions";
import { cn } from "@/lib/utils";
import { useEditor } from "@/stores/editor";
import { useUi } from "@/stores/ui";

/** "/" block inserter: searchable, grouped snippet list with a live rendered preview. */
export function InsertMenu() {
  const engine = useEngine();
  const { look } = useDeck();
  const { insertOpen, insertAt, snipHover, set } = useEditor();
  const width = useUi((s) => s.width);
  const actions = useDeckActions();
  const [query, setQuery] = useState("");
  const matches = useMemo(() => searchSnippets(BLOCK_SNIPPETS, query), [query]);
  const groups = useMemo(() => {
    // Grouped by category while browsing; one ranked list while searching.
    const g: { cat: string; items: { i: number; label: string; icon: string }[] }[] = [];
    for (const i of matches) {
      const s = BLOCK_SNIPPETS[i];
      const cat = query ? "Results" : s.cat;
      let G = g.find((x) => x.cat === cat);
      if (!G) g.push((G = { cat, items: [] }));
      G.items.push({ i, label: s.label, icon: s.icon || "cube" });
    }
    return g;
  }, [matches, query]);
  const order = groups.flatMap((g) => g.items.map((it) => it.i));
  const snip = BLOCK_SNIPPETS[snipHover] ?? BLOCK_SNIPPETS[0];
  const preview = useMemo(() => engine.parse(`# ${snip.label}\n${snip.md}`).slides[0], [engine, snip]);
  if (!insertOpen) return null;
  const close = () => {
    setQuery("");
    set({ insertOpen: false });
  };
  const insert = (i: number) => {
    setQuery("");
    actions.insertAtCursor(BLOCK_SNIPPETS[i].md);
  };
  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const at = order.indexOf(snipHover);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!order.length) return;
      const next = at < 0 ? 0 : (at + (e.key === "ArrowDown" ? 1 : order.length - 1)) % order.length;
      set({ snipHover: order[next] });
      document.getElementById(`snip-${order[next]}`)?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = at >= 0 ? snipHover : order[0];
      if (pick != null) insert(pick);
    } else if (e.key === "Escape") close();
  };
  const w = Math.min(640, width - 24);
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={close} />
      <div
        className="fixed z-50 flex h-[380px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        style={{ left: Math.max(12, Math.min(insertAt.x, width - w - 12)), top: Math.min(insertAt.y, window.innerHeight - 392), width: w }}
      >
        <div className="flex w-56 shrink-0 flex-col border-r border-zinc-800">
          <div className="flex items-center gap-2 border-b border-zinc-800 px-3">
            <Icon name="magnifying-glass" className="text-zinc-500" />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                const first = searchSnippets(BLOCK_SNIPPETS, e.target.value)[0];
                if (first != null) set({ snipHover: first });
              }}
              onKeyDown={onSearchKey}
              placeholder="Search blocks, diagrams…"
              aria-label="Search blocks"
              className="h-9 min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-zinc-600"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto py-1.5">
          {!order.length && <p className="px-3 py-4 text-xs text-zinc-500">No blocks match “{query}”</p>}
          {groups.map((g) => (
            <div key={g.cat}>
              <div className="px-3 pt-2 pb-1 text-[10px] tracking-wider text-zinc-500 uppercase">{g.cat}</div>
              {g.items.map((it) => (
                <button
                  key={it.i}
                  id={`snip-${it.i}`}
                  type="button"
                  onMouseEnter={() => set({ snipHover: it.i })}
                  onClick={() => insert(it.i)}
                  className={cn("flex h-7 w-full items-center gap-2 px-3 text-left text-[13px] text-zinc-300", it.i === snipHover && "bg-zinc-800/70 text-zinc-50")}
                >
                  <Icon name={it.icon} className="text-zinc-400" />
                  {it.label}
                </button>
              ))}
            </div>
          ))}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-3">
          {preview && <SlideView slide={preview} index={0} total={1} look={thumbLook(look)} />}
          <pre className="min-h-0 flex-1 overflow-auto rounded-md bg-zinc-900/70 p-2 font-mono text-[11px] leading-4 text-zinc-400">{snip.md}</pre>
          <Button size="sm" className="self-end bg-zinc-50 text-zinc-950 hover:bg-zinc-200" onClick={() => insert(snipHover)}>
            Insert {snip.label} <span className="ml-1 text-zinc-500">↵</span>
          </Button>
        </div>
      </div>
    </>
  );
}
