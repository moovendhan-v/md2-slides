"use client";

import { createContext, useContext, useDeferredValue, useMemo, type ReactNode } from "react";
import type { Deck } from "@/engine/types";
import { useEngine } from "@/engine/provider";
import { buildLook, deckOptions, type DeckOptions, type Look } from "@/domain/deck/look";
import { resolveRelative, slideAtLine } from "@/domain/deck/queries";
import { splitKey, useWorkspace } from "@/stores/workspace";
import { useEditor } from "@/stores/editor";

export interface ActiveDeck {
  key: string;
  repo: string;
  path: string;
  src: string;
  deck: Deck;
  options: DeckOptions;
  look: Look;
  /** Slide under the editor caret. */
  current: number;
}

const Ctx = createContext<ActiveDeck | null>(null);

/**
 * Parses the active file once per change (in Wasm) and shares the result.
 * `useDeferredValue` keeps typing responsive: the preview re-renders at lower
 * priority than keystrokes on very large decks.
 */
export function DeckProvider({ children }: { children: ReactNode }) {
  const engine = useEngine();
  const key = useWorkspace((s) => s.activeKey);
  const files = useWorkspace((s) => s.files);
  const src = useDeferredValue(files[key] ?? "");
  const curLine = useEditor((s) => s.curLine);
  const { repo, path } = splitKey(key);

  const parsed = useMemo(() => {
    const read = (p: string) => files[`${repo}::${p.replace(/^\.?\//, "")}`];
    const deck = engine.parse(src, read);
    // `<!-- src: ./other.md -->` pulls another file's slides in place.
    deck.slides = deck.slides.flatMap((sl) => {
      const rel = sl.dir.src;
      if (!rel) return [sl];
      const text = files[`${repo}::${resolveRelative(path, rel)}`];
      if (text == null) {
        deck.problems.push({ line: sl.startLine, sev: "error", msg: `src: file not found ${rel}` });
        return [sl];
      }
      return engine.parse(text).slides.map((x) => ({ ...x, startLine: sl.startLine, titleLine: sl.startLine, imported: rel }));
    });
    const options = deckOptions(deck.meta);
    return { deck, options, look: buildLook(options) };
    // `files` only matters for imports; re-parse when the source or file set changes.
  }, [engine, src, files, repo, path]);

  const value = useMemo<ActiveDeck>(
    () => ({ key, repo, path, src, ...parsed, current: slideAtLine(parsed.deck, curLine) }),
    [key, repo, path, src, parsed, curLine],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDeck(): ActiveDeck {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDeck must be used inside <DeckProvider>");
  return v;
}
