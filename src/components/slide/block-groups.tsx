"use client";

import type { Slide } from "@/engine/types";
import { animCss } from "@/domain/deck/slide-frame";
import { useBlockEnv } from "./render-context";
import { blockComponent } from "./blocks/registry";

const HOVER = "hover:shadow-[0_0_0_2px_rgba(96,165,250,.9)] hover:bg-[rgba(96,165,250,.05)]";

/** Column groups (split by `|||`) with per-block animation, reveal and edit overlay. */
export function BlockGroups({ slide, anim, stagger, clicksOn }: { slide: Slide; anim: string; stagger: number; clicksOn: boolean }) {
  const { look, opts } = useBlockEnv();
  let order = 0;
  return (
    <div style={{ flexShrink: 0, pointerEvents: "auto", display: "flex", flexWrap: "wrap", gap: "2.4cqw", alignItems: "stretch", marginTop: ".6cqw", alignSelf: "stretch", textAlign: "left" }}>
      {slide.groups
        .filter((g) => g.length)
        .map((g, gi) => (
          <div key={gi} style={{ flex: "1 1 0", minWidth: "24%", display: "flex", flexDirection: "column", gap: "1.5cqw", borderRadius: look.r }}>
            {g.map((b) => {
              const i = order++;
              const shown = !clicksOn || opts.clicks == null || i < opts.clicks;
              const C = blockComponent(b.type);
              const style = b.args?.style;
              return (
                <div
                  key={b.line + b.type}
                  title={opts.edit ? `${b.type}${style ? " · " + style : ""} — click to restyle` : undefined}
                  style={{
                    opacity: shown ? 1 : 0, translate: shown ? "0 0" : "0 1.6cqw", transition: "opacity .35s ease, translate .35s ease",
                    animation: animCss(anim, i + 3, stagger), position: "relative", minWidth: 0, borderRadius: look.r,
                    boxShadow: opts.selectedLine === b.line ? `0 0 0 2px ${look.accent}` : "none",
                  }}
                >
                  {opts.edit && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        opts.onPick?.(b);
                      }}
                      className={HOVER}
                      style={{ position: "absolute", inset: "-.7cqw", borderRadius: look.r, cursor: "pointer", zIndex: 3 }}
                    />
                  )}
                  {C ? <C block={b} /> : null}
                </div>
              );
            })}
          </div>
        ))}
    </div>
  );
}
