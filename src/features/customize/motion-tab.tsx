"use client";

import { useState } from "react";
import { ANIMS, TRANSITIONS } from "@/domain/deck/constants";
import { transitionCss } from "@/domain/deck/slide-frame";
import { useDeck } from "@/app-shell/deck-context";
import { Chip, Section, SliderRow } from "@/components/common/controls";
import { Icon } from "@/components/common/icon";
import { SlideView } from "@/components/slide/slide-view";
import { useDeckActions } from "@/hooks/use-deck-actions";

type Preview = { kind: "tr" | "an"; v: string } | null;

export function MotionTab() {
  const { deck, current, look, options: o } = useDeck();
  const actions = useDeckActions();
  const [seed, setSeed] = useState(0);
  const [preview, setPreview] = useState<Preview>(null);
  const sl = deck.slides[current];
  const dir = sl?.dir ?? {};
  const replay = () => setSeed((s) => s + 1);
  const groups: { label: string; hint: string; kind: "tr" | "an"; list: readonly string[]; cur: string; set: (v: string) => void }[] = [
    { label: "Slide transition · deck", hint: "front-matter", kind: "tr", list: TRANSITIONS, cur: o.transition, set: (v) => actions.setOption("transition", v) },
    { label: "Block animation · deck", hint: "front-matter", kind: "an", list: ANIMS, cur: o.animate, set: (v) => actions.setOption("animate", v) },
    { label: "Slide transition · this slide", hint: `slide ${current + 1}`, kind: "tr", list: ["inherit", ...TRANSITIONS], cur: dir.transition || "inherit", set: (v) => actions.setDirective("transition", v === "inherit" ? null : v) },
    { label: "Block animation · this slide", hint: `slide ${current + 1}`, kind: "an", list: ["inherit", ...ANIMS], cur: dir.animate || "inherit", set: (v) => actions.setDirective("animate", v === "inherit" ? null : v) },
  ];
  const tr = preview?.kind === "tr" ? preview.v : dir.transition || o.transition;
  const an = preview?.kind === "an" && preview.v !== "inherit" ? preview.v : dir.animate || o.animate;
  return (
    <>
      {sl && (
        <div className="flex flex-col gap-2">
          <div className="overflow-hidden rounded-lg">
            <div key={seed} style={{ animation: transitionCss(tr === "inherit" ? o.transition : tr) }}>
              <SlideView slide={{ ...sl, dir: { ...sl.dir, animate: an } }} index={current} total={deck.slides.length} look={look} opts={{ animate: true, seed }} />
            </div>
          </div>
          <button type="button" onClick={() => { setPreview(null); replay(); }} className="flex items-center gap-1.5 self-end text-xs text-zinc-400 hover:text-zinc-100">
            <Icon name="arrow-counter-clockwise" /> Replay
          </button>
        </div>
      )}
      {groups.map((g) => (
        <Section key={g.label} title={g.label} hint={g.hint}>
          <div className="flex flex-wrap gap-1.5" onMouseLeave={() => setPreview(null)}>
            {g.list.map((v) => (
              <Chip
                key={v}
                active={g.cur === v}
                onClick={() => {
                  g.set(v);
                  replay();
                }}
                onMouseEnter={() => {
                  setPreview({ kind: g.kind, v });
                  replay();
                }}
              >
                {v}
              </Chip>
            ))}
          </div>
        </Section>
      ))}
      <SliderRow label="Stagger between blocks" value={o.stagger} min={0} max={400} step={10} display={`${o.stagger}ms`} onChange={(v) => actions.setOption("stagger", v)} />
    </>
  );
}
