"use client";

import { useMemo, useState } from "react";
import { thumbLook } from "@/domain/deck/look";
import { useDeck } from "@/app-shell/deck-context";
import { Seg } from "@/components/common/controls";
import { SlideView } from "@/components/slide/slide-view";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useEngine } from "@/engine/provider";
import { useDeckActions } from "@/hooks/use-deck-actions";
import { useTemplatesQuery } from "@/hooks/use-queries";
import { useUi } from "@/stores/ui";

const CATS = ["All", "Basic", "Custom", "Cards", "Media", "Charts", "Diagrams", "Architecture", "DevOps", "Debugging", "API"];
const BASIC: [string, string][] = [
  ["Blank", "# New slide\nSay one thing."],
  ["Title", "<!-- layout: center -->\n^ Section\n# Big title\nOne-line subtitle."],
  ["Statement", "<!-- layout: statement -->\n# One bold idea in a sentence."],
  ["Bullets", "# Title\n- First point\n- Second point\n- Third point"],
  ["Two columns", "# Title\n### Left\n- point\n|||\n### Right\n- point"],
  ["Quote", "> A memorable line.\n— Author"],
];

/** Pick a single-slide layout to insert after the current slide. */
export function NewSlideDialog() {
  const open = useUi((s) => s.modal === "newSlide");
  const close = useUi((s) => s.closeModal);
  const engine = useEngine();
  const { look, current } = useDeck();
  const actions = useDeckActions();
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const singles = useTemplatesQuery({ source: "single" });
  const lk = useMemo(() => thumbLook(look), [look]);

  const list = useMemo(() => {
    const basic = BASIC.map(([name, md]) => ({ name, cat: "Basic", md }));
    const all = [...basic, ...(singles.data?.items ?? []).map((t) => ({ name: t.name, cat: t.cat, md: t.md }))];
    const ql = q.toLowerCase();
    return all
      .filter((t) => (cat === "All" || t.cat === cat) && (!ql || `${t.name} ${t.cat}`.toLowerCase().includes(ql)))
      .map((t) => ({ ...t, slide: engine.parse(t.md).slides[0] }));
  }, [singles.data, cat, q, engine]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="flex max-h-[85vh] flex-col border-zinc-800 bg-zinc-950 sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>New slide</DialogTitle>
          <DialogDescription>Inserted after slide {current + 1}.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Seg pill size="sm" value={cat} onChange={setCat} options={CATS.map((id) => ({ id, label: id }))} />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search layouts…" className="ml-auto h-8 w-48 border-zinc-800 text-xs" />
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-4 overflow-y-auto pr-1 md:grid-cols-3">
          {list.map((t) => (
            <button key={t.name + t.cat} type="button" onClick={() => actions.insertSlide(t.md)} className="flex flex-col gap-1.5 text-left">
              <div className="overflow-hidden rounded-lg ring-1 ring-zinc-800 hover:ring-blue-500">{t.slide && <SlideView slide={t.slide} index={0} total={1} look={lk} />}</div>
              <span className="text-xs text-zinc-200">
                {t.name} <span className="text-zinc-500">· {t.cat}</span>
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
