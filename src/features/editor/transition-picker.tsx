"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TRANSITIONS } from "@/domain/deck/constants";
import { thumbLook } from "@/domain/deck/look";
import { transitionCss } from "@/domain/deck/slide-frame";
import { useDeck } from "@/app-shell/deck-context";
import { Chip } from "@/components/common/controls";
import { Icon } from "@/components/common/icon";
import { SlideView } from "@/components/slide/slide-view";
import { useDeckActions } from "@/hooks/use-deck-actions";
import { useEditor } from "@/stores/editor";
import { useUi } from "@/stores/ui";

/** Popover to set the transition into one slide, with hover preview. */
export function TransitionPicker() {
  const pick = useEditor((s) => s.transitionPick);
  const set = useEditor((s) => s.set);
  const width = useUi((s) => s.width);
  const { deck, look, options } = useDeck();
  const actions = useDeckActions();
  const [hover, setHover] = useState<string | null>(null);
  const [seed, setSeed] = useState(0);
  const sl = pick ? deck.slides[pick.index] : undefined;
  if (!pick || !sl) return null;
  const def = options.transition;
  const own = sl.dir.transition;
  const shown = hover || own || def;
  const w = Math.min(440, width - 24);
  const above = pick.y >= 380;
  // Vertical strip: open beside the chip, kept inside the window.
  const place: React.CSSProperties =
    pick.side === "right"
      ? { left: Math.min(pick.x + 8, width - w - 12), top: Math.max(12, Math.min(pick.y - 120, window.innerHeight - 440)) }
      : { left: Math.max(12, Math.min(pick.x - 20, width - w - 12)), ...(above ? { bottom: window.innerHeight - pick.y + 8 } : { top: pick.y + 36 }) };
  const choose = (v: string) => {
    actions.setDirective("transition", v === "inherit" ? null : v, pick.index);
    setSeed(seed + 1);
  };
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => set({ transitionPick: null })} />
      <div
        className="fixed z-50 flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3 shadow-2xl"
        style={{ ...place, width: w }}
      >
        <div className="flex items-center justify-between text-[13px]">
          <span>
            Transition <span className="text-zinc-500">into slide {pick.index + 1}</span>
          </span>
          <button type="button" onClick={() => set({ transitionPick: null })} className="text-zinc-500 hover:text-zinc-100" aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="overflow-hidden rounded-md">
          <div key={`${shown}-${seed}`} style={{ animation: transitionCss(shown) }}>
            <SlideView slide={sl} index={pick.index} total={deck.slides.length} look={thumbLook(look)} />
          </div>
        </div>
        <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto">
          {["inherit", ...TRANSITIONS].map((v) => (
            <Chip
              key={v}
              active={(own || "inherit") === v}
              onClick={() => choose(v)}
              onMouseEnter={() => {
                setHover(v === "inherit" ? def : v);
                setSeed((x) => x + 1);
              }}
            >
              {v === "inherit" ? `default (${def})` : v === "none" ? "cut" : v}
            </Chip>
          ))}
        </div>
        <button
          type="button"
          className="self-start text-xs text-blue-400 hover:text-blue-300"
          onClick={() => {
            actions.setOption("transition", own || def);
            set({ transitionPick: null });
            toast(`All slides → ${own || def}`);
          }}
        >
          Apply “{own || def}” to all slides
        </button>
      </div>
    </>
  );
}
