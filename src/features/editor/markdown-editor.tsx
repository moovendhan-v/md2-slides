"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BLOCK_SNIPPETS } from "@/data";
import { highlightMarkdown } from "@/domain/deck/highlight";
import { frontMatterEnd } from "@/domain/source/frontmatter";
import { lineOffset } from "@/domain/source/slides";
import { useDeck } from "@/app-shell/deck-context";
import { useDeckActions } from "@/hooks/use-deck-actions";
import { useEditor } from "@/stores/editor";
import { useActiveSource, useWorkspace } from "@/stores/workspace";

const LINE = 20;
const PAD = 12;

/**
 * Plain `<textarea>` over a syntax-coloured mirror. Keeps native editing,
 * IME and undo while giving deck-aware highlighting and an error gutter.
 */
export function MarkdownEditor() {
  const src = useActiveSource();
  const setSource = useWorkspace((s) => s.setSource);
  const { deck } = useDeck();
  const actions = useDeckActions();
  const { curLine, jump, insertOpen, snipHover, set } = useEditor();
  const ta = useRef<HTMLTextAreaElement>(null);
  const [scroll, setScroll] = useState({ top: 0, left: 0 });

  const lines = useMemo(() => {
    const L = src.split("\n");
    const fm = frontMatterEnd(L);
    return L.map((t, i) => highlightMarkdown(t, i > 0 && i < fm));
  }, [src]);
  const errLines = useMemo(() => new Set(deck.problems.filter((p) => p.sev === "error").map((p) => p.line)), [deck.problems]);

  // Honour jump requests from the preview, strip, palette and problems list.
  useEffect(() => {
    const el = ta.current;
    if (!el || !jump) return;
    const { start, end } = lineOffset(el.value, jump.line);
    el.focus({ preventScroll: true });
    el.setSelectionRange(start, end);
    el.scrollTop = Math.max(0, jump.line * LINE - 120);
  }, [jump]);

  const syncCaret = (el: HTMLTextAreaElement) => {
    const ln = el.value.slice(0, el.selectionStart).split("\n").length - 1;
    if (ln !== useEditor.getState().curLine) set({ curLine: ln });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const N = BLOCK_SNIPPETS.length;
    if (insertOpen && ["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) {
      e.preventDefault();
      if (e.key === "Enter") actions.insertAtCursor(BLOCK_SNIPPETS[snipHover].md);
      else set({ snipHover: (snipHover + (e.key === "ArrowDown" ? 1 : N - 1)) % N });
      return;
    }
    if (insertOpen && e.key.length === 1) set({ insertOpen: false });
    if (e.key === "Tab") {
      e.preventDefault();
      const a = el.selectionStart;
      setSource(el.value.slice(0, a) + "  " + el.value.slice(el.selectionEnd));
      requestAnimationFrame(() => el.setSelectionRange(a + 2, a + 2));
    }
    if (e.key === "/") {
      const before = el.value.slice(0, el.selectionStart).split("\n").pop() ?? "";
      const after = el.value.slice(el.selectionStart).split("\n")[0];
      if (!before.trim() && !after.trim()) {
        e.preventDefault();
        const r = el.getBoundingClientRect();
        const ln = el.value.slice(0, el.selectionStart).split("\n").length - 1;
        set({ insertOpen: true, syntaxOpen: false, insertAt: { x: r.left + 48, y: r.top + PAD + (ln + 1) * LINE - el.scrollTop + 6 } });
      }
    }
  };

  const mono = "font-mono text-[13px] leading-5";
  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden bg-zinc-950">
      <div className={`${mono} w-12 shrink-0 overflow-hidden pr-3 text-right select-none`} style={{ paddingTop: PAD }} aria-hidden>
        <div style={{ transform: `translateY(${-scroll.top}px)` }}>
          {lines.map((_, i) => (
            <div key={i} className={errLines.has(i) ? "text-red-400" : i === curLine ? "text-zinc-300" : "text-zinc-700"}>
              {i + 1}
            </div>
          ))}
        </div>
      </div>
      <div className="relative min-w-0 flex-1">
        <div className={`${mono} pointer-events-none absolute inset-0 overflow-hidden whitespace-pre`} aria-hidden>
          <div style={{ transform: `translate(${-scroll.left}px, ${-scroll.top}px)`, padding: `${PAD}px ${PAD}px 200px 4px` }}>
            {lines.map((segs, i) => (
              <div key={i} style={{ background: i === curLine ? "rgba(255,255,255,.045)" : undefined, minHeight: LINE }}>
                {segs.map((s, j) => (
                  <span key={j} style={{ color: s.c }}>
                    {s.t}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <textarea
          ref={ta}
          value={src}
          spellCheck={false}
          aria-label="Deck Markdown"
          wrap="off"
          onChange={(e) => {
            setSource(e.target.value);
            syncCaret(e.target);
          }}
          onSelect={(e) => syncCaret(e.currentTarget)}
          onClick={(e) => syncCaret(e.currentTarget)}
          onKeyDown={onKeyDown}
          onScroll={(e) => setScroll({ top: e.currentTarget.scrollTop, left: e.currentTarget.scrollLeft })}
          className={`${mono} absolute inset-0 resize-none overflow-auto bg-transparent text-transparent caret-zinc-100 outline-none`}
          style={{ padding: `${PAD}px ${PAD}px 200px 4px`, whiteSpace: "pre" }}
        />
      </div>
    </div>
  );
}
