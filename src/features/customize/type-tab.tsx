"use client";

import { FONTS } from "@/domain/deck/constants";
import { useDeck } from "@/app-shell/deck-context";
import { Section, SliderRow } from "@/components/common/controls";
import { useDeckActions } from "@/hooks/use-deck-actions";
import { cn } from "@/lib/utils";

export function TypeTab() {
  const { options: o } = useDeck();
  const { setOption } = useDeckActions();
  return (
    <>
      <Section title="Font pairing">
        <div className="flex flex-col gap-2">
          {Object.entries(FONTS).map(([id, f]) => (
            <button
              key={id}
              type="button"
              onClick={() => setOption("font", id)}
              className={cn("flex items-baseline justify-between rounded-lg px-3 py-2.5 text-left ring-1", o.font === id ? "ring-zinc-50" : "ring-zinc-800 hover:ring-zinc-600")}
            >
              <span style={{ fontFamily: f.head, fontWeight: f.w }} className="text-lg">
                Aa
              </span>
              <span className="flex flex-col items-end">
                <span className="text-xs text-zinc-200">{f.label}</span>
                <span className="text-[11px] text-zinc-500" style={{ fontFamily: f.body }}>
                  Body text sample
                </span>
              </span>
            </button>
          ))}
        </div>
      </Section>
      <SliderRow label="Global text size" value={o.fontScale} min={0.6} max={1.6} step={0.05} display={`${o.fontScale.toFixed(2)}×`} onChange={(v) => setOption("fontScale", v)} />
      <SliderRow label="Title size" value={o.titleScale} min={0.6} max={1.8} step={0.05} display={`${o.titleScale.toFixed(2)}×`} onChange={(v) => setOption("titleScale", v)} />
      <SliderRow label="Body size" value={o.bodyScale} min={0.7} max={1.6} step={0.05} display={`${o.bodyScale.toFixed(2)}×`} onChange={(v) => setOption("bodyScale", v)} />
      <SliderRow label="Code & data size" value={o.codeScale} min={0.7} max={1.6} step={0.05} display={`${o.codeScale.toFixed(2)}×`} onChange={(v) => setOption("codeScale", v)} />
    </>
  );
}
