"use client";

import { toast } from "sonner";
import { isMediaLayout } from "@/domain/source/directives";
import { useDeck } from "@/app-shell/deck-context";
import { Chip, Section, SliderRow } from "@/components/common/controls";
import { Input } from "@/components/ui/input";
import { useDeckActions } from "@/hooks/use-deck-actions";
import { cn } from "@/lib/utils";

/** [id, label, image box: left, top, width, height, radius, clip, text left] — drawn as mini diagrams. */
const LAYOUTS: [string, string, string, string, string, string, string, string, string][] = [
  ["", "Auto", "0", "0", "0", "0", "0", "none", "8%"],
  ["center", "Center", "0", "0", "0", "0", "0", "none", "36%"],
  ["image-left", "Img left", "0", "0", "44%", "100%", "0", "none", "52%"],
  ["image-right", "Img right", "56%", "0", "44%", "100%", "0", "none", "8%"],
  ["diagonal", "Diagonal", "46%", "0", "54%", "100%", "0", "polygon(22% 0,100% 0,100% 100%,0 100%)", "8%"],
  ["image-full", "Full bleed", "0", "0", "100%", "100%", "0", "none", "8%"],
  ["image-top", "Img top", "0", "0", "100%", "46%", "0", "none", "8%"],
  ["circle", "Circle", "60%", "20%", "32%", "60%", "50%", "none", "8%"],
  ["arch", "Arch", "60%", "14%", "32%", "86%", "40% 40% 0 0", "none", "8%"],
];
const POS = ["left top", "top", "right top", "left", "center", "right", "left bottom", "bottom", "right bottom"];
const IMG_OPTS: [string, string, string[], string][] = [
  ["Fit", "fit", ["cover", "contain", "fill", "none"], "cover"],
  ["Filter", "filter", ["none", "grayscale", "sepia", "duotone", "bright", "dim", "blur"], "none"],
];

export function LayoutSection() {
  const { deck, current } = useDeck();
  const actions = useDeckActions();
  const sl = deck.slides[current];
  const lay = sl?.layout ?? "";
  const dir = sl?.dir ?? {};
  return (
    <>
      <Section title="Layout">
        <div className="grid grid-cols-3 gap-2">
          {LAYOUTS.map(([id, label, l, t, w, h, r, clip, tx]) => (
            <button key={id || "auto"} type="button" onClick={() => actions.setLayout(id)} className="flex flex-col gap-1">
              <span className={cn("relative aspect-video w-full overflow-hidden rounded-md bg-zinc-900 ring-1", lay === id ? "ring-zinc-50" : "ring-zinc-800")}>
                {w !== "0" && <span className="absolute bg-blue-500/60" style={{ left: l, top: t, width: w, height: h, borderRadius: r, clipPath: clip }} />}
                <span className="absolute top-[35%] h-[8%] w-[28%] rounded-sm bg-zinc-300" style={{ left: tx }} />
                <span className="absolute top-[52%] h-[5%] w-[20%] rounded-sm bg-zinc-600" style={{ left: tx }} />
              </span>
              <span className={cn("text-[11px]", lay === id ? "text-zinc-50" : "text-zinc-400")}>{label}</span>
            </button>
          ))}
        </div>
      </Section>
      {isMediaLayout(lay) && (
        <Section title="Image">
          <div className="flex gap-2">
            <Input key={current} defaultValue={dir.image || ""} placeholder="https://…/photo.jpg" onChange={(e) => actions.setLayoutImage(e.target.value)} className="h-8 border-zinc-800 text-xs" />
            <label className="flex h-8 cursor-pointer items-center rounded-md border border-zinc-800 px-3 text-xs hover:bg-zinc-900">
              Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const dataUrl = reader.result as string;
                    actions.setLayoutImage(dataUrl);
                    toast.success("Image embedded into deck");
                  };
                  reader.readAsDataURL(f);
                }}
              />
            </label>
          </div>
          {IMG_OPTS.map(([label, key, opts, def]) => (
            <div key={key} className="flex flex-wrap items-center gap-1.5">
              <span className="w-12 text-[11px] text-zinc-500">{label}</span>
              {opts.map((v) => (
                <Chip key={v} active={(dir[key] || def) === v} onClick={() => actions.setDirective(key, v === def ? null : v)}>
                  {v}
                </Chip>
              ))}
            </div>
          ))}
          <div className="flex items-center gap-3">
            <span className="w-12 text-[11px] text-zinc-500">Focus</span>
            <div className="grid grid-cols-3 gap-1">
              {POS.map((p) => (
                <button
                  key={p}
                  type="button"
                  title={p}
                  onClick={() => actions.setDirective("pos", p === "center" ? null : p)}
                  className={cn("size-4 rounded-sm border", (dir.pos || "center") === p ? "border-zinc-50 bg-zinc-50" : "border-zinc-600")}
                />
              ))}
            </div>
            <Chip active={dir.flip === "true"} onClick={() => actions.setDirective("flip", dir.flip === "true" ? null : "true")}>
              mirrored
            </Chip>
          </div>
          <SliderRow label="Image width" value={+(dir.mw || 44)} min={20} max={70} step={1} display={`${dir.mw || 44}%`} onChange={(v) => actions.setDirective("mw", String(v))} />
          <SliderRow label="Dark overlay" value={+(dir.shade || 0)} min={0} max={0.9} step={0.05} display={`${Math.round(+(dir.shade || 0) * 100)}%`} onChange={(v) => actions.setDirective("shade", String(v))} />
          <SliderRow label="Corner radius" value={+(dir.mr || 0)} min={0} max={20} step={0.5} display={`${dir.mr || 0}cqw`} onChange={(v) => actions.setDirective("mr", String(v))} />
        </Section>
      )}
    </>
  );
}
