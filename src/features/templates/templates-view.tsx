"use client";

import { useState } from "react";
import type { TemplateRecord, TemplateSource } from "@/engine/types";
import { Seg } from "@/components/common/controls";
import { Icon } from "@/components/common/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTemplatesQuery } from "@/hooks/use-queries";
import { useUi } from "@/stores/ui";
import { TemplateCard } from "./template-card";
import { TemplatePreviewDialog } from "./template-preview-dialog";

const PER = 9;
const DECK_CATS = ["All", "Engineering", "Business", "Marketing", "Education"];
const SINGLE_CATS = ["All", "Custom", "Architecture", "Diagrams", "Charts", "Cards", "Media", "DevOps", "Debugging", "API"];

export function TemplatesView() {
  const [source, setSource] = useState<Exclude<TemplateSource, "all">>("builtin");
  const [category, setCategory] = useState("All");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [preview, setPreview] = useState<TemplateRecord | null>(null);
  const setView = useUi((s) => s.setView);
  const { data, isFetching } = useTemplatesQuery({ source, category, q, page, per: PER });
  const cats = source === "single" ? SINGLE_CATS : DECK_CATS;
  const reset = (fn: () => void) => {
    fn();
    setPage(0);
  };
  const info = data?.total ? `${data.page * PER + 1}–${Math.min(data.total, (data.page + 1) * PER)} of ${data.total}` : "No templates match";

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
            <p className="text-[13px] text-zinc-500">Start a deck from a layout. Each one is plain Markdown plus theme settings in its front-matter.</p>
          </div>
          {source === "community" && (
            <Button variant="outline" className="gap-1.5 border-zinc-800" onClick={() => setView("studio")}>
              <Icon name="code-block" /> Build a layout in the studio
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Seg
            value={source}
            onChange={(v) => reset(() => { setSource(v); setCategory("All"); })}
            options={[
              { id: "builtin", label: "Decks" },
              { id: "single", label: "Single slides" },
              { id: "community", label: "Community" },
            ]}
          />
          <Seg pill value={category} onChange={(v) => reset(() => setCategory(v))} options={cats.map((id) => ({ id, label: id }))} />
          <div className="relative ml-auto w-full sm:w-60">
            <Icon name="magnifying-glass" className="absolute top-1/2 left-3 -translate-y-1/2 text-zinc-500" />
            <Input value={q} onChange={(e) => reset(() => setQ(e.target.value))} placeholder="Search templates…" className="h-9 border-zinc-800 pl-9 text-[13px]" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" style={{ opacity: isFetching ? 0.7 : 1 }}>
          {data?.items.map((t) => (
            <TemplateCard key={t.id} template={t} onOpen={() => setPreview(t)} />
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{info}</span>
          {data && data.pages > 1 && (
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="h-8 border-zinc-800" disabled={data.page === 0} onClick={() => setPage(data.page - 1)}>
                <Icon name="caret-left" /> Prev
              </Button>
              {Array.from({ length: data.pages }, (_, i) => (
                <Button key={i} size="sm" variant={i === data.page ? "default" : "ghost"} className="h-8 w-8" onClick={() => setPage(i)}>
                  {i + 1}
                </Button>
              ))}
              <Button variant="outline" size="sm" className="h-8 border-zinc-800" disabled={data.page >= data.pages - 1} onClick={() => setPage(data.page + 1)}>
                Next <Icon name="caret-right" />
              </Button>
            </div>
          )}
        </div>
      </div>
      <TemplatePreviewDialog template={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
