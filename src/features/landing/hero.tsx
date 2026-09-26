"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/common/icon";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { captionIndex } from "./choreography";
import { DEMO_DECK_HASH } from "./demo-link";
import { FallbackDeck } from "./fallback-deck";
import { usePrefersStatic, useScrollProgress } from "./use-scroll-progress";

const DeckCanvas = dynamic(() => import("./deck-canvas"), { ssr: false });

const CAPTIONS = [
  { k: "01", t: "Write Markdown", s: "One .md file in your repo is one deck. Blocks, diagrams and code are just text." },
  { k: "02", t: "Style it in seconds", s: "Themes, layouts, motion and components. Drag slides around, it rewrites the Markdown." },
  { k: "03", t: "Present anywhere", s: "Full presenter with notes and pen, a share link with no server, or one offline HTML file." },
];

/** Sticky, scroll-driven hero: the deck fans, stacks, then presents as you scroll. */
export function Hero({ signedIn }: { signedIn: boolean }) {
  const section = useRef<HTMLElement>(null);
  const { progress, coarse } = useScrollProgress(section);
  const still = usePrefersStatic();
  const [visible, setVisible] = useState(true);
  const [wide, setWide] = useState(true);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    const mq = window.matchMedia("(min-width: 768px)");
    const onMq = () => setWide(mq.matches);
    onMq();
    mq.addEventListener("change", onMq);
    return () => {
      io.disconnect();
      mq.removeEventListener("change", onMq);
    };
  }, []);

  const cap = captionIndex(coarse);
  const headline = 1 - Math.min(1, coarse / 0.25);
  return (
    <section ref={section} className={cn("relative", still ? "h-dvh" : "h-[280vh]")} aria-label="Introduction">
      <div className="sticky top-0 h-dvh overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(59,130,246,.18),transparent_70%)]" />
        <div className="absolute inset-0">{still === false ? <DeckCanvas progress={progress} active={visible} wide={wide} /> : still ? <FallbackDeck /> : null}</div>

        {/* Scrim so the headline reads over the scene; fades with it. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/70 to-transparent md:via-35% md:to-65%" style={{ opacity: still ? 0.6 : headline }} />
        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-5 pb-14 md:justify-center md:pb-0">
          <div className="max-w-xl transition-opacity duration-300" style={{ opacity: still ? 1 : headline }}>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/70 px-3 py-1 text-xs text-zinc-400 backdrop-blur">
              <span className="size-1.5 rounded-full bg-blue-500" /> Markdown → slides, synced to GitHub
            </span>
            <h1 className="text-[clamp(2.4rem,6vw,4.6rem)] leading-[0.98] font-semibold tracking-[-0.04em] text-balance text-zinc-50">{BRAND.tagline}</h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-zinc-400">{BRAND.description}</p>
            <div className={cn("mt-8 flex flex-wrap gap-3", headline < 0.3 && !still && "pointer-events-none")}>
              <Link href="/app" className="flex h-11 items-center gap-2 rounded-lg bg-zinc-50 px-5 text-sm font-semibold text-zinc-950 hover:bg-zinc-200">
                <Icon name={signedIn ? "folder-open" : "github-logo"} /> {signedIn ? "Open your decks" : "Start with GitHub"}
              </Link>
              <a href={`/v#${DEMO_DECK_HASH}`} className="flex h-11 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 px-5 text-sm font-medium text-zinc-200 backdrop-blur hover:border-zinc-600">
                <Icon name="play" /> View a demo deck
              </a>
            </div>
          </div>
        </div>

        {!still && (
          <div className={cn("absolute inset-x-0 bottom-8 z-10 mx-auto flex max-w-6xl justify-end px-5", headline > 0.3 && "max-md:hidden")} aria-live="polite">
            <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 backdrop-blur transition-opacity duration-300" style={{ opacity: 1 - headline * 0.6 }}>
              <div className="flex items-center gap-2 font-mono text-xs text-blue-400">
                {CAPTIONS[cap].k}
                <span className="h-px flex-1 bg-zinc-800">
                  <span className="block h-px bg-blue-500 transition-[width]" style={{ width: `${Math.round(coarse * 100)}%` }} />
                </span>
              </div>
              <div className="mt-2 text-base font-semibold text-zinc-50">{CAPTIONS[cap].t}</div>
              <p className="mt-1 text-[13px] leading-relaxed text-zinc-400">{CAPTIONS[cap].s}</p>
            </div>
          </div>
        )}
        {!still && coarse < 0.05 && (
          <div className="absolute inset-x-0 bottom-6 z-10 hidden justify-center text-xs text-zinc-500 md:flex">
            <span className="flex items-center gap-1.5">
              <Icon name="mouse-scroll" /> Scroll
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
