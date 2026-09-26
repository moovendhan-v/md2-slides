"use client";

import { BGS } from "@/domain/deck/constants";
import { buildLook } from "@/domain/deck/look";
import { useDeck } from "@/app-shell/deck-context";
import { Section, Seg, SliderRow } from "@/components/common/controls";
import { useDeckActions } from "@/hooks/use-deck-actions";

export function CanvasTab() {
  const { options: o } = useDeck();
  const { setOption } = useDeckActions();
  return (
    <>
      <Section title="Background">
        <div className="grid grid-cols-3 gap-2">
          {BGS.map((id) => (
            <button key={id} type="button" onClick={() => setOption("bg", id)} className="flex flex-col gap-1 text-left">
              <span
                className="aspect-video w-full rounded-md"
                style={{ background: buildLook({ ...o, bg: id }).bgCss, boxShadow: o.bg === id ? "0 0 0 2px #fafafa" : "inset 0 0 0 1px #27272a", containerType: "inline-size" }}
              />
              <span className="text-[11px] text-zinc-400 capitalize">{id}</span>
            </button>
          ))}
        </div>
      </Section>
      <Section title="Aspect ratio">
        <Seg value={o.aspectKey} onChange={(v) => setOption("aspect", v)} options={["16:9", "4:3", "1:1"].map((id) => ({ id, label: id }))} />
      </Section>
      <SliderRow label="Corner radius" value={o.radius} min={0} max={30} step={1} onChange={(v) => setOption("radius", v)} />
      <Section title="Density">
        <Seg
          value={o.density}
          onChange={(v) => setOption("density", v)}
          options={[
            { id: "compact", label: "Compact" },
            { id: "normal", label: "Normal" },
            { id: "roomy", label: "Roomy" },
          ]}
        />
      </Section>
    </>
  );
}
