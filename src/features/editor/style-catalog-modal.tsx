import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/common/icon";
import { VARIANTS, ANIM_TEMPLATES } from "@/domain/deck/constants";
import type { BlockType } from "@/engine/types";
import { useDeckActions } from "@/hooks/use-deck-actions";
import { cn } from "@/lib/utils";


interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES = [
  { id: "anim", name: "Animations", icon: "sparkle" },
  { id: "csv", name: "CSV Data & Charts", icon: "table" },
  { id: "counter", name: "Counters & Stats", icon: "timer" },
  { id: "cards", name: "Feature Cards", icon: "squares-four" },
  { id: "flow", name: "Diagrams & Flows", icon: "flow-arrow" },
  { id: "chart", name: "Charts", icon: "chart-bar" },
  { id: "math", name: "Math LaTeX", icon: "function" },
];

export function StyleCatalogModal({ open, onOpenChange }: Props) {
  const [selectedCat, setSelectedCat] = useState<string>("anim");
  const actions = useDeckActions();

  const styles: string[] = (VARIANTS[selectedCat as BlockType] as string[]) || [];


  const handleInsert = (blockType: string, styleName: string) => {
    let snippet = `:::${blockType} style=${styleName}\n`;
    if (blockType === "anim") {
      snippet += `Build interactive slides with WebAssembly and Tailwind CSS.\n:::\n`;
    } else if (blockType === "csv") {
      snippet += `Category,Value\nAlpha,45\nBeta,72\nGamma,28\n:::\n`;
    } else if (blockType === "counter") {
      snippet += `99.98% | Uptime | Global SLA\n100M+ | Queries | Daily throughput\n:::\n`;
    } else if (blockType === "cards") {
      snippet += `- sparkle | Fast | Cold starts under 80ms\n- shield-check | Secure | Sandboxed execution\n- paint-brush | Themeable | Any brand style\n:::\n`;
    } else if (blockType === "flow") {
      snippet += `- rocket | Step 1 | Initialize\n- gear | Step 2 | Execute\n- check | Step 3 | Verify\n:::\n`;
    } else if (blockType === "chart") {
      snippet += `- Q1 | 18\n- Q2 | 26\n- Q3 | 42\n:::\n`;
    } else {
      snippet += `Content\n:::\n`;
    }

    actions.insertInline(snippet);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-zinc-800 bg-zinc-950 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-white">
            <Icon name="palette" className="text-blue-400" />
            <span>Block Styles & Templates Catalog</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 pt-2">
          {/* Category sidebar */}
          <div className="flex w-48 shrink-0 flex-col gap-1 border-r border-zinc-800/80 pr-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCat(cat.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors",
                  selectedCat === cat.id
                    ? "bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/40"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                )}
              >
                <Icon name={cat.icon} />
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Style items grid */}
          <div className="flex-1">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                Available <code className="font-mono text-blue-400">style=</code> options for :::
                {selectedCat}
              </span>
              <span className="text-[11px] text-zinc-500">Click any style to insert</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {styles.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => handleInsert(selectedCat, style)}
                  className="group flex flex-col items-start rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-left transition-all hover:border-blue-500/50 hover:bg-zinc-800/80 hover:shadow-lg"
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-zinc-200 group-hover:text-blue-400">
                      {style}
                    </span>
                    <Icon name="plus" className="text-xs text-zinc-500 opacity-0 group-hover:opacity-100" />
                  </div>
                  <span className="mt-1 text-[11px] text-zinc-500 line-clamp-1">
                    :::
                    {selectedCat} style={style}
                  </span>
                </button>
              ))}
            </div>

            {selectedCat === "anim" && (
              <div className="mt-6 border-t border-zinc-800/80 pt-4">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Preset <code className="font-mono text-purple-400">template=</code> Options
                </span>
                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  {ANIM_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => {
                        actions.insertInline(`:::anim style=shimmer template=${tpl}\n- sparkle | Title | Description\n:::\n`);
                        onOpenChange(false);
                      }}
                      className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2.5 text-left text-xs font-mono text-zinc-300 transition-colors hover:border-purple-500/40 hover:bg-zinc-800 hover:text-purple-300"
                    >
                      template={tpl}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
