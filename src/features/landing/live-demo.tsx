"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { highlightMarkdown } from "@/domain/deck/highlight";
import { buildLook, deckOptions } from "@/domain/deck/look";
import { slideAtLine } from "@/domain/deck/queries";
import { SlideView } from "@/components/slide/slide-view";
import { Icon } from "@/components/common/icon";
import { EngineProvider, useEngine } from "@/engine/provider";
import { DEMO_SCRIPT } from "./content";
import { lineOf } from "./typing";
import { useTypingDemo } from "./use-typing-demo";

function Editor({ text, caret }: { text: string; caret: number }) {
  const lines = text.split("\n");
  const caretLine = lineOf(text, caret);
  const caretCol = caret - text.slice(0, caret).lastIndexOf("\n") - 1;
  const box = useRef<HTMLDivElement>(null);
  // Keep the line being edited in view, like a real editor (jump when it leaves the middle band).
  useEffect(() => {
    const el = box.current;
    const row = el?.children[caretLine] as HTMLElement | undefined;
    if (!el || !row) return;
    const y = row.offsetTop - el.scrollTop;
    if (y < el.clientHeight * 0.2 || y > el.clientHeight * 0.75) el.scrollTop = Math.max(0, row.offsetTop - el.clientHeight * 0.45);
  }, [caretLine, text]);
  return (
    <div ref={box} className="relative min-h-0 flex-1 overflow-hidden p-4 font-mono text-[12.5px] leading-[1.6]">
      {lines.map((l, i) => (
        <div key={i} className={i === caretLine ? "-mx-4 bg-white/[.04] px-4" : undefined}>
          <span className="mr-4 inline-block w-5 text-right text-zinc-600 select-none">{i + 1}</span>
          {highlightMarkdown(l.slice(0, i === caretLine ? caretCol : l.length), false).map((s, j) => (
            <span key={j} style={{ color: s.c }}>
              {s.t}
            </span>
          ))}
          {i === caretLine && <span className="ml-px inline-block h-[1.1em] w-[2px] translate-y-[3px] animate-pulse bg-blue-400" />}
          {i === caretLine &&
            highlightMarkdown(l.slice(caretCol), false).map((s, j) => (
              <span key={`r${j}`} style={{ color: s.c }}>
                {s.t}
              </span>
            ))}
        </div>
      ))}
    </div>
  );
}

function Preview({ text, caret }: { text: string; caret: number }) {
  const engine = useEngine();
  const parsed = useMemo(() => {
    const deck = engine.parse(text || "# ");
    return { deck, look: buildLook(deckOptions(deck.meta)) };
  }, [engine, text]);
  const i = Math.max(0, slideAtLine(parsed.deck, lineOf(text, caret)));
  const slide = parsed.deck.slides[i];
  return (
    <div className="flex flex-1 flex-col justify-center gap-3 p-4">
      {slide ? <SlideView slide={slide} index={i} total={parsed.deck.slides.length} look={parsed.look} /> : <div className="aspect-video rounded-lg bg-zinc-900" />}
      <div className="flex justify-center gap-1.5">
        {parsed.deck.slides.map((_, k) => (
          <span key={k} className={k === i ? "h-1.5 w-5 rounded-full bg-blue-500" : "size-1.5 rounded-full bg-zinc-700"} />
        ))}
      </div>
    </div>
  );
}

/** Editor + preview frame: the Markdown types itself and the real engine re-renders the slide on every keystroke. */
export function LiveDemo() {
  const frame = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [still, setStill] = useState(false);
  useEffect(() => {
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "200px" });
    if (frame.current) io.observe(frame.current);
    return () => io.disconnect();
  }, []);
  const { text, caret } = useTypingDemo(DEMO_SCRIPT, visible, still);

  return (
    <div ref={frame} id="demo" className="scroll-mt-24 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-[0_40px_120px_-40px_rgba(59,130,246,.35)]">
      <div className="flex h-10 items-center gap-2 border-b border-zinc-800 px-4 text-xs text-zinc-500">
        <span className="flex gap-1.5">
          {["#f87171", "#fbbf24", "#4ade80"].map((c) => (
            <span key={c} className="size-2.5 rounded-full" style={{ background: c }} />
          ))}
        </span>
        <span className="ml-3 flex items-center gap-1.5 font-mono text-zinc-400">
          <Icon name="file-md" /> decks/acme-q3.md
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="size-1.5 animate-pulse rounded-full bg-green-400" /> live preview
        </span>
      </div>
      <div className="grid md:grid-cols-2">
        <div className="flex h-[260px] min-h-0 flex-col overflow-hidden border-b border-zinc-800 md:h-[400px] md:border-r md:border-b-0">
          <Editor text={text} caret={caret} />
        </div>
        <div className="flex bg-[radial-gradient(80%_80%_at_50%_0%,rgba(59,130,246,.08),transparent)] md:h-[400px]">
          <EngineProvider fallback={<div className="m-4 flex-1 animate-pulse rounded-lg bg-zinc-900" />}>
            <Preview text={text} caret={caret} />
          </EngineProvider>
        </div>
      </div>
    </div>
  );
}
