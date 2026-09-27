"use client";

import { toast } from "sonner";
import type { Block } from "@/engine/types";
import { useDeck } from "@/app-shell/deck-context";
import { Chip, SliderRow } from "@/components/common/controls";
import { Input } from "@/components/ui/input";
import { useDeckActions } from "@/hooks/use-deck-actions";

const GROUPS: [string, string, string[], string][] = [
  ["Filter", "filter", ["none", "grayscale", "blur"], "none"],
  ["Ratio", "ar", ["16:9", "4:3", "1:1", "3:4"], "16:9"],
  ["Position", "pos", ["center", "top", "bottom", "left", "right"], "center"],
];

/** Source, size and treatment controls for an inline `![](…){…}` image. */
export function ImageOptions({ block }: { block: Block }) {
  const { deck } = useDeck();
  const actions = useDeckActions();
  // Read the freshest args from the parsed deck (the picked block is a snapshot).
  const live = deck.slides.flatMap((s) => s.groups.flat()).find((b) => b.line === block.line && b.type === "image") ?? block;
  const a = live.args ?? {};
  const upd = (k: string, v: string) => actions.setImageArg(block.line, k, v);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Input placeholder="https://…/image.jpg" defaultValue={live.src ?? ""} onChange={(e) => actions.setImageSrc(block.line, e.target.value)} className="h-8 border-zinc-800 text-xs" />
        <label className="flex h-8 cursor-pointer items-center rounded-md border border-zinc-800 px-3 text-xs whitespace-nowrap hover:bg-zinc-900">
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
                actions.setImageSrc(block.line, dataUrl);
                toast.success("Image embedded into deck");
              };
              reader.readAsDataURL(f);
            }}
          />
        </label>
      </div>
      {GROUPS.map(([label, key, opts, def]) => (
        <div key={key} className="flex flex-wrap items-center gap-1.5">
          <span className="w-16 text-xs text-zinc-400">{label}</span>
          {opts.map((v) => (
            <Chip key={v} active={(a[key] || def) === v} onClick={() => upd(key, v === def ? "" : v)}>
              {v}
            </Chip>
          ))}
        </div>
      ))}
      <div className="grid grid-cols-2 gap-4">
        <SliderRow label="Width" value={+(a.w || 100)} min={20} max={100} step={5} display={`${a.w || 100}%`} onChange={(v) => upd("w", String(v))} />
        <SliderRow label="Corner radius" value={+(a.r ?? 12)} min={0} max={40} step={2} display={`${+(a.r ?? 12) / 10}cqw`} onChange={(v) => upd("r", String(v))} />
      </div>
    </div>
  );
}
