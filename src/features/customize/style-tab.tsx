"use client";

import { ACCENTS, PALETTES } from "@/domain/deck/constants";
import { useDeck } from "@/app-shell/deck-context";
import { Section, Seg, Swatch, ToggleRow } from "@/components/common/controls";
import { useDeckActions } from "@/hooks/use-deck-actions";
import { cn } from "@/lib/utils";

export function StyleTab() {
  const { options: o } = useDeck();
  const { setOption } = useDeckActions();
  return (
    <>
      <Section title="Slide appearance">
        <Seg value={o.mode} onChange={(v) => setOption("mode", v)} options={[{ id: "dark", label: "Dark" }, { id: "light", label: "Light" }]} />
        <p className="text-[11px] text-zinc-500">Affects slides only — the app stays dark.</p>
      </Section>
      <ToggleRow label="Glassmorphism" sub="Frosted cards, tables and stats" checked={o.glass} onChange={(v) => setOption("glass", v)} />
      <Section title="Palette">
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(PALETTES).map(([id, p]) => {
            const q = o.mode === "light" ? p.light : p.dark;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setOption("theme", id)}
                className={cn("flex flex-col gap-2 rounded-lg p-2 text-left ring-1", o.palette === id ? "ring-zinc-50" : "ring-zinc-800 hover:ring-zinc-600")}
              >
                <span className="flex h-6 overflow-hidden rounded">
                  {[q[0], q[3], q[1]].map((c, i) => (
                    <span key={i} className="flex-1" style={{ background: c }} />
                  ))}
                </span>
                <span className="text-xs text-zinc-300">{p.label}</span>
              </button>
            );
          })}
        </div>
      </Section>
      <Section title="Accent">
        <div className="flex flex-wrap gap-2.5">
          {ACCENTS.map((a) => (
            <Swatch key={a} color={a} active={o.accent === a} onClick={() => setOption("accent", a)} />
          ))}
          <label className="relative size-7 cursor-pointer overflow-hidden rounded-full ring-1 ring-zinc-700" title="Custom colour">
            <span className="absolute inset-0" style={{ background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)" }} />
            <input type="color" value={o.accent} onChange={(e) => setOption("accent", e.target.value)} className="absolute inset-0 opacity-0" />
          </label>
        </div>
      </Section>
    </>
  );
}
