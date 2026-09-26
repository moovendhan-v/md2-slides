"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { highlightMarkdown } from "@/domain/deck/highlight";
import { buildLook, deckOptions } from "@/domain/deck/look";
import { slideAtLine } from "@/domain/deck/queries";
import { transitionCss } from "@/domain/deck/slide-frame";
import { SlideView } from "@/components/slide/slide-view";
import { Icon } from "@/components/common/icon";
import { EngineProvider, useEngine } from "@/engine/provider";
import { cn } from "@/lib/utils";
import { DEMO_SCRIPT } from "./content";
import { lineOf } from "./typing";
import { useTypingDemo, type TypingDemo } from "./use-typing-demo";

type Flash = TypingDemo["flash"];

/** Eased scrollTop animation (the editor follows the caret without jumping). */
function scrollTo(el: HTMLElement, top: number, ms = 380) {
  const from = el.scrollTop;
  const t0 = performance.now();
  const step = (t: number) => {
    const k = Math.min(1, (t - t0) / ms);
    el.scrollTop = from + (top - from) * (1 - (1 - k) ** 3);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function Editor({ text, caret, flash, typing }: { text: string; caret: number; flash: Flash; typing: boolean }) {
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
    if (y < el.clientHeight * 0.2 || y > el.clientHeight * 0.75) scrollTo(el, Math.max(0, row.offsetTop - el.clientHeight * 0.45));
  }, [caretLine, text]);
  return (
    <div ref={box} className="relative min-h-0 flex-1 overflow-hidden p-4 font-mono text-[12.5px] leading-[1.6]">
      {lines.map((l, i) => (
        <div
          key={flash && i >= flash.from && i <= flash.to ? `${i}:${flash.id}` : i}
          className={cn("-mx-4 px-4", i === caretLine && "bg-white/[.04]")}
          style={flash && i >= flash.from && i <= flash.to ? { animation: "demo-flash 1.6s ease-out both" } : undefined}
        >
          <span className="mr-4 inline-block w-5 text-right text-zinc-600 select-none">{i + 1}</span>
          {highlightMarkdown(l.slice(0, i === caretLine ? caretCol : l.length), false).map((s, j) => (
            <span key={j} style={{ color: s.c }}>
              {s.t}
            </span>
          ))}
          {i === caretLine && (
            <span className="ml-px inline-block h-[1.1em] w-[2px] translate-y-[3px] bg-blue-400" style={typing ? undefined : { animation: "demo-caret 1.05s steps(1) infinite" }} />
          )}
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

/** Slide change → a real transition; theme change → blur cross-fade; content edits update in place. */
function transitionFor(prev: { i: number; theme: string } | undefined, i: number, theme: string) {
  if (!prev) return "none";
  if (prev.theme !== theme) return transitionCss("blur", ".8s");
  if (prev.i !== i) return transitionCss(i > prev.i ? "slide-up" : "slide-down", ".7s");
  return "none";
}

function Preview({ text, caret, flash, settled }: { text: string; caret: number; flash: Flash; settled: boolean }) {
  const engine = useEngine();
  const parsed = useMemo(() => {
    const t0 = performance.now();
    const deck = engine.parse(text || "# ");
    return { deck, look: buildLook(deckOptions(deck.meta)), ms: performance.now() - t0 };
  }, [engine, text]);
  const i = Math.max(0, slideAtLine(parsed.deck, lineOf(text, caret)));
  const slide = parsed.deck.slides[i];
  const theme = String(parsed.deck.meta.theme ?? "") + String(parsed.deck.meta.accent ?? "");
  // Remount (and animate) only when the slide changes, or the theme once its edit is finished
  // (not on every keystroke of "midnight").
  const shown = useRef<{ i: number; theme: string; key: number; anim: string }>(undefined);
  if (!shown.current || shown.current.i !== i || (settled && shown.current.theme !== theme))
    shown.current = { i, theme, key: (shown.current?.key ?? 0) + 1, anim: transitionFor(shown.current, i, theme) };
  const { key, anim } = shown.current;
  return (
    <div className="relative flex flex-1 flex-col justify-center gap-3 overflow-hidden p-4">
      <div key={flash ? `f${flash.id}` : "f"} className="rounded-lg" style={flash ? { animation: "demo-ring 1.1s ease-out both" } : undefined}>
        <div key={key} style={{ animation: anim }}>
          {slide ? <SlideView slide={slide} index={i} total={parsed.deck.slides.length} look={parsed.look} /> : <div className="aspect-video rounded-lg bg-zinc-900" />}
        </div>
      </div>
      <div className="flex justify-center gap-1.5">
        {parsed.deck.slides.map((_, k) => (
          <span key={k} className={cn("h-1.5 rounded-full transition-all duration-500", k === i ? "w-5 bg-blue-500" : "w-1.5 bg-zinc-700")} />
        ))}
      </div>
      {flash && (
        <span
          key={flash.id}
          className="absolute top-3 right-3 flex items-center gap-1 rounded-full border border-green-500/30 bg-zinc-950/85 px-2 py-0.5 font-mono text-[10.5px] text-green-300 backdrop-blur"
          style={{ animation: "demo-chip 2.6s ease-out both" }}
        >
          <Icon name="check" /> rendered in {Math.max(1, Math.round(parsed.ms))} ms
        </span>
      )}
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
  const { text, caret, flash, phase } = useTypingDemo(DEMO_SCRIPT, visible, still);

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
          <Editor text={text} caret={caret} flash={flash} typing={phase !== "holding"} />
        </div>
        <div className="flex bg-[radial-gradient(80%_80%_at_50%_0%,rgba(59,130,246,.08),transparent)] md:h-[400px]">
          <EngineProvider fallback={<div className="m-4 flex-1 animate-pulse rounded-lg bg-zinc-900" />}>
            <Preview text={text} caret={caret} flash={flash} settled={phase === "holding"} />
          </EngineProvider>
        </div>
      </div>
    </div>
  );
}
