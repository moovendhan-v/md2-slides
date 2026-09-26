"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Deck } from "@/engine/types";
import { useEngine } from "@/engine/provider";
import { buildLook, deckOptions, type DeckOptions, type Look } from "@/domain/deck/look";
import { paginate } from "@/domain/deck/paginate";
import { resolveRelative, slideAtLine } from "@/domain/deck/queries";
import { splitKey, useWorkspace } from "@/stores/workspace";
import { useEditor } from "@/stores/editor";
import { pref, useSession } from "@/stores/session";
import { useDebounced } from "@/hooks/use-debounced";

export interface ActiveDeck {
  key: string;
  repo: string;
  path: string;
  src: string;
  /** Display deck: overflowing slides split into parts (1a, 1b …). */
  deck: Deck;
  /** Deck exactly as authored — use for source edits addressed by slide index. */
  source: Deck;
  options: DeckOptions;
  look: Look;
  /** Slide under the editor caret. */
  current: number;
}

const Ctx = createContext<ActiveDeck | null>(null);

/**
 * Parses the active file once per change (in Wasm, ~1 ms) and shares the
 * result. Parsing is synchronous on purpose: a deferred (low-priority) value
 * could be starved and leave the preview showing a stale or empty deck while
 * the editor moved on. Very large decks use the debounced "live off" mode.
 */
export function DeckProvider({ children }: { children: ReactNode }) {
  const engine = useEngine();
  const key = useWorkspace((s) => s.activeKey);
  const live = useSession((s) => pref(s.prefs, "live", true));
  // Live: re-parse every keystroke at low priority. Off: wait for a typing pause (large decks).
  const raw = useWorkspace((s) => s.files[s.activeKey] ?? "");
  const src = useDebounced(raw, live ? 0 : 600);
  const curLine = useEditor((s) => s.curLine);
  const { repo, path } = splitKey(key);

  const parsed = useMemo(() => {
    // Other files are read at parse time (imports), so edits elsewhere never force a re-parse here.
    const files = useWorkspace.getState().files;
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
    return { deck: paginate(deck, options), source: deck, options, look: buildLook(options) };
  }, [engine, src, repo, path]);

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
