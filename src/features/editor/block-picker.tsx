"use client";

import { useMemo } from "react";
import type { Block } from "@/engine/types";
import { TRANSFORMS, VARIANTS } from "@/domain/deck/constants";
import { thumbLook } from "@/domain/deck/look";
import { blockRange, setVariant } from "@/domain/source/blocks";
import { canTransform } from "@/domain/source/transform";
import { useDeck } from "@/app-shell/deck-context";
import { Chip, Seg } from "@/components/common/controls";
import { Icon } from "@/components/common/icon";
import { SlideView } from "@/components/slide/slide-view";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEngine } from "@/engine/provider";
import { useDeckActions } from "@/hooks/use-deck-actions";
import { cn } from "@/lib/utils";
import { useEditor } from "@/stores/editor";
import { ImageOptions } from "./image-options";

const label = (v: string) => (v === "iconLeft" ? "icon left" : v === "h" ? "horizontal" : v === "v" ? "vertical" : v.toLowerCase());

function currentVariant(b: Block, glass: boolean) {
  if (b.type === "callout") return b.kind ?? "NOTE";
  return b.args?.style || (b.type === "cards" ? (glass ? "glass" : "grid") : VARIANTS[b.type]?.[0] ?? "");
}

/** Restyle / transform / edit a block chosen in the preview. */
export function BlockPicker() {
  const engine = useEngine();
  const pick = useEditor((s) => s.pick);
  const set = useEditor((s) => s.set);
  const { src, look } = useDeck();
  const actions = useDeckActions();

  const variants = useMemo(() => {
    if (!pick || !VARIANTS[pick.type]) return [];
    const text = blockRange(src, pick).text;
    const mini = { ...pick, line: 0 };
    return VARIANTS[pick.type]!.map((v) => {
      const slide = engine.parse(setVariant(text, mini, v)).slides[0];
      return { v, slide: slide && { ...slide, title: "", kicker: "", body: "" } };
    });
  }, [pick, src, engine]);

  if (!pick) return null;
  const cur = currentVariant(pick, look.glass);
  const lk = thumbLook(look);
  const close = () => set({ pick: null });
  return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-zinc-800 bg-zinc-950 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[15px]">
            {pick.type} block <span className="font-mono text-xs font-normal text-zinc-500 normal-case">line {pick.line + 1}</span>
          </DialogTitle>
        </DialogHeader>
        {variants.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {variants.map(({ v, slide }) => (
              <button key={v} type="button" onClick={() => actions.setVariant(pick, v)} className="flex flex-col gap-1.5 text-left">
                <div className={cn("overflow-hidden rounded-lg ring-1", v === cur ? "ring-2 ring-blue-500" : "ring-zinc-800 hover:ring-zinc-600")}>
                  {slide && <SlideView slide={slide} index={0} total={1} look={lk} />}
                </div>
                <span className={cn("text-xs", v === cur ? "text-zinc-50" : "text-zinc-400")}>{label(v)}</span>
              </button>
            ))}
          </div>
        )}
        {pick.type === "cards" && (
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            Columns
            <Seg size="sm" value={pick.args?.cols ?? ""} onChange={(v) => actions.setFenceArg(pick, "cols", String(v))} options={["1", "2", "3", "4"].map((id) => ({ id, label: id }))} />
          </div>
        )}
        {pick.type === "image" && <ImageOptions block={pick} />}
        {canTransform(pick) && (
          <div className="flex flex-col gap-2">
            <span className="text-xs text-zinc-400">Transform into</span>
            <div className="flex flex-wrap gap-1.5">
              {TRANSFORMS.filter((t) => t !== pick.type).map((t) => (
                <Chip key={t} active={false} onClick={() => actions.transformBlock(pick, t)}>
                  {t}
                </Chip>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2 border-t border-zinc-800 pt-3">
          <button type="button" onClick={() => { close(); useEditor.getState().jumpTo(pick.line); }} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs hover:bg-zinc-900">
            <Icon name="code" /> Edit source
          </button>
          <button type="button" onClick={() => actions.duplicateBlock(pick)} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs hover:bg-zinc-900">
            <Icon name="copy" /> Duplicate
          </button>
          <button type="button" onClick={() => actions.removeBlock(pick)} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-red-400 hover:bg-zinc-900">
            <Icon name="trash" /> Delete
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
