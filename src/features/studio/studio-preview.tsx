"use client";

import { useMemo } from "react";
import { slideData, validateLayout } from "@/domain/deck/custom-layout";
import { buildLook, deckOptions, thumbLook } from "@/domain/deck/look";
import { Seg, Swatch } from "@/components/common/controls";
import { Icon } from "@/components/common/icon";
import { SlideView } from "@/components/slide/slide-view";
import { useEngine } from "@/engine/provider";
import { useStudio } from "@/stores/studio";

const ACCENTS = ["#60a5fa", "#a78bfa", "#f472b6", "#4ade80", "#fb923c"];

/** Live render of the layout being edited, plus validation and slot data. */
export function StudioPreview() {
  const engine = useEngine();
  const { html, config, sample, id: fallbackId, mode, accent, set } = useStudio();
  const { config: cfg, errors } = useMemo(() => validateLayout(html, config), [html, config]);
  const id = cfg?.id || fallbackId;
  const look = useMemo(() => thumbLook(buildLook({ ...deckOptions({}), mode, accent })), [mode, accent]);
  const slide = useMemo(() => engine.parse(sample.replace(/layout:\s*custom:[\w-]+/, `layout: custom:${id}`)).slides[0], [engine, sample, id]);
  const opts = useMemo(() => ({ layouts: { [id]: { html } } }), [id, html]);
  const usage = `<!-- layout: custom:${id} -->`;
  return (
    <div className="flex w-full flex-col gap-3 overflow-y-auto p-4 lg:w-[46%]">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400">Live preview</span>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {ACCENTS.map((a) => (
              <Swatch key={a} color={a} active={accent === a} onClick={() => set({ accent: a })} />
            ))}
          </div>
          <Seg size="sm" value={mode} onChange={(v) => set({ mode: v })} options={[{ id: "dark", label: "Dark" }, { id: "light", label: "Light" }]} />
        </div>
      </div>
      {slide && <SlideView slide={slide} index={0} total={1} look={look} opts={opts} />}
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(usage).catch(() => undefined)}
        className="flex items-center gap-2 rounded-lg bg-zinc-900/70 px-3 py-2 text-left font-mono text-xs text-violet-300 hover:bg-zinc-900"
        title="Copy"
      >
        <Icon name="copy" className="text-zinc-500" />
        {usage}
      </button>
      {errors.map((e) => (
        <p key={e.msg} className={`flex items-center gap-1.5 text-xs ${e.tip ? "text-amber-400" : "text-red-400"}`}>
          <Icon name={e.tip ? "lightbulb" : "x-circle"} /> {e.msg}
        </p>
      ))}
      <details className="text-xs text-zinc-400">
        <summary className="cursor-pointer select-none">Slot data from sample.md</summary>
        <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-zinc-900/70 p-2 font-mono text-[11px] text-zinc-400">
          {slide ? JSON.stringify(slideData(slide), null, 2).slice(0, 900) : "{}"}
        </pre>
      </details>
    </div>
  );
}
