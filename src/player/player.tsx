"use client";

import { useEffect, useMemo, useState } from "react";
import { DeckProvider, useDeck } from "@/app-shell/deck-context";
import { Icon } from "@/components/common/icon";
import { seedMermaid } from "@/components/slide/mermaid-render";
import { SlideView } from "@/components/slide/slide-view";
import { slideLabel } from "@/domain/deck/queries";
import { slideNumber } from "@/domain/deck/paginate";
import { expiresIn, type SharePayload } from "@/domain/share/payload";
import { Presenter } from "@/features/present/presenter";
import { usePresenterKeys } from "@/hooks/use-presenter-keys";
import { useViewportWidth } from "@/hooks/use-viewport-width";
import { usePresent } from "@/stores/present";
import { fileKey, useWorkspace } from "@/stores/workspace";
import { useSlideSync } from "./use-slide-sync";

const REPO = "share";

function download(name: string, text: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/markdown" }));
  a.download = name.endsWith(".md") ? name : `${name}.md`;
  a.click();
  URL.revokeObjectURL(a.href);
}

const btn = "flex h-8 items-center gap-1.5 rounded-md border border-zinc-800 px-2.5 text-[13px] text-zinc-300 hover:bg-zinc-900";

/** Read-only deck: scrollable slides, presenter, optional speaker window. */
function PlayerShell({ payload, speaker }: { payload: SharePayload; speaker: boolean }) {
  const { deck, look } = useDeck();
  const presenting = usePresent((s) => s.active);
  const [audience, setAudience] = useState(false);
  const channel = useMemo(() => `md2slides:${payload.name}:${payload.created}`, [payload]);
  useViewportWidth();
  usePresenterKeys();
  useSlideSync(channel);

  useEffect(() => {
    const start = Number(new URLSearchParams(location.search).get("slide") ?? 1) - 1;
    if (speaker || payload.opts.present) usePresent.getState().start(Math.max(0, Math.min(start, deck.slides.length - 1)));
    // Only on first mount: later deck changes never happen in the viewer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deep link to the current slide (?slide=N — the fragment stays the deck).
  useEffect(
    () =>
      usePresent.subscribe((s) => {
        const url = new URL(location.href);
        url.searchParams.set("slide", String(s.index + 1));
        history.replaceState(null, "", url);
      }),
    [],
  );

  const openSpeaker = () => {
    const url = new URL(location.href);
    url.searchParams.set("speaker", "1");
    window.open(url, "md2slides-speaker", "width=1200,height=760");
    setAudience(true);
    if (!usePresent.getState().active) usePresent.getState().start(0);
  };

  const exp = expiresIn(payload);
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-950 text-zinc-50">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-zinc-800 bg-zinc-950/90 px-4 backdrop-blur">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{payload.name}</div>
          <div className="truncate text-xs text-zinc-500">
            {deck.slides[0]?.sourceTotal ?? deck.slides.length} slides · shared {new Date(payload.created).toLocaleDateString()}
            {exp && ` · expires ${exp}`}
          </div>
        </div>
        {payload.opts.download && (
          <button type="button" className={btn} onClick={() => download(payload.path.split("/").pop() || payload.name, payload.md)}>
            <Icon name="download-simple" /> <span className="hidden sm:inline">.md</span>
          </button>
        )}
        {payload.opts.notes && (
          <button type="button" className={btn} onClick={openSpeaker} title="Open a speaker window with notes, next slide and timer">
            <Icon name="presentation-chart" /> <span className="hidden sm:inline">Speaker view</span>
          </button>
        )}
        <button type="button" onClick={() => usePresent.getState().start(0)} className="flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-[13px] font-semibold text-white hover:bg-blue-500">
          <Icon name="play" /> Present
        </button>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8">
        {deck.slides.map((sl, i) => (
          <section key={i} className="flex flex-col gap-2" id={`slide-${i + 1}`}>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="font-mono">{slideNumber(sl, i)}</span>
              <span className="truncate">{slideLabel(sl, i)}</span>
              <button type="button" onClick={() => usePresent.getState().start(i)} className="ml-auto flex items-center gap-1 hover:text-zinc-200">
                <Icon name="play" /> Present from here
              </button>
            </div>
            <button type="button" className="text-left" onClick={() => usePresent.getState().start(i)} aria-label={`Present slide ${i + 1}`}>
              <SlideView slide={sl} index={i} total={deck.slides.length} look={look} />
            </button>
            {payload.opts.notes && sl.notes.trim() && <p className="rounded-lg bg-zinc-900/60 px-3 py-2 text-[13px] whitespace-pre-wrap text-zinc-400">{sl.notes}</p>}
          </section>
        ))}
        <footer className="py-6 text-center text-xs text-zinc-600">
          Made with md2slides · this deck lives only in the link, nothing is stored on a server
        </footer>
      </main>
      {presenting && <Presenter mode={{ notes: payload.opts.notes && (speaker || !audience), share: false, side: speaker || !audience }} />}
    </div>
  );
}

/**
 * The read-only player used by share links (`/v#…`) and the HTML export.
 * Seeds the workspace with the payload so the normal deck pipeline (Wasm
 * parse, pagination, renderer, presenter) runs unchanged.
 */
export function Player({ payload, speaker = false }: { payload: SharePayload; speaker?: boolean }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const key = fileKey(REPO, payload.path);
    const files: Record<string, string> = { [key]: payload.md };
    for (const [p, text] of Object.entries(payload.files ?? {})) files[fileKey(REPO, p)] = text;
    seedMermaid(payload.svg);
    useWorkspace.setState({ files, orig: files, paths: { [REPO]: [payload.path, ...Object.keys(payload.files ?? {})] }, activeKey: key });
    setReady(true);
  }, [payload]);
  if (!ready) return null;
  return (
    <DeckProvider>
      <PlayerShell payload={payload} speaker={speaker} />
    </DeckProvider>
  );
}
