import { useEffect, useRef, useState } from "react";
import { VARIANTS, ANIM_TEMPLATES, LAYOUTS, TRANSITIONS, ANIMS } from "@/domain/deck/constants";
import type { BlockType } from "@/engine/types";
import { Icon } from "@/components/common/icon";
import { cn } from "@/lib/utils";


interface SuggestionItem {
  label: string;
  detail?: string;
  insertValue: string;
  type?: "style" | "template" | "block" | "layout" | "directive";
}

interface Props {
  textBeforeCaret: string;
  onSelect: (value: string, replaceLen: number) => void;
  position: { x: number; y: number } | null;
  onClose: () => void;
}

export function AutoSuggest({ textBeforeCaret, onSelect, position, onClose }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine what to suggest based on cursor context
  const { suggestions, query, replaceLen } = (() => {
    // 1. `style=` inside a fenced block
    const styleMatch = textBeforeCaret.match(/:::(anim|animation|motion|csv|counter|cards|stats|flow|chart|gallery|timeline|terminal|list|math)\b.*?style=([a-zA-Z0-9_-]*)$/i);
    if (styleMatch) {
      const block = styleMatch[1].toLowerCase() as BlockType;
      const q = styleMatch[2].toLowerCase();
      const list: string[] = (VARIANTS[block] as string[]) || [];
      const filtered = list.filter((v: string) => v.toLowerCase().includes(q));
      return {
        suggestions: filtered.map((v: string) => ({
          label: v,
          detail: `${block} style`,
          insertValue: v,
          type: "style" as const,
        })),
        query: q,
        replaceLen: q.length,
      };
    }

    // 2. `template=` inside anim block
    const templateMatch = textBeforeCaret.match(/:::(anim|animation|motion)\b.*?template=([a-zA-Z0-9_-]*)$/i);
    if (templateMatch) {
      const q = templateMatch[2].toLowerCase();
      const filtered = (ANIM_TEMPLATES as readonly string[]).filter((t: string) => t.toLowerCase().includes(q));
      return {
        suggestions: filtered.map((t: string) => ({
          label: t,
          detail: "anim template preset",
          insertValue: t,
          type: "template" as const,
        })),
        query: q,
        replaceLen: q.length,
      };
    }

    // 3. `<!-- layout: `
    const layoutMatch = textBeforeCaret.match(/<!--\s*layout:\s*([a-zA-Z0-9_-]*)$/i);
    if (layoutMatch) {
      const q = layoutMatch[1].toLowerCase();
      const filtered = (LAYOUTS as readonly string[]).filter((l: string) => l.toLowerCase().includes(q));
      return {
        suggestions: filtered.map((l: string) => ({
          label: l,
          detail: "layout directive",
          insertValue: `${l} -->`,
          type: "layout" as const,
        })),
        query: q,
        replaceLen: q.length,
      };
    }

    // 4. `<!-- transition: `
    const trMatch = textBeforeCaret.match(/<!--\s*transition:\s*([a-zA-Z0-9_-]*)$/i);
    if (trMatch) {
      const q = trMatch[1].toLowerCase();
      const filtered = (TRANSITIONS as readonly string[]).filter((t: string) => t.toLowerCase().includes(q));
      return {
        suggestions: filtered.map((t: string) => ({
          label: t,
          detail: "slide transition",
          insertValue: `${t} -->`,
          type: "directive" as const,
        })),
        query: q,
        replaceLen: q.length,
      };
    }

    // 5. `<!-- animate: `
    const anMatch = textBeforeCaret.match(/<!--\s*animate:\s*([a-zA-Z0-9_-]*)$/i);
    if (anMatch) {
      const q = anMatch[1].toLowerCase();
      const filtered = (ANIMS as readonly string[]).filter((a: string) => a.toLowerCase().includes(q));
      return {
        suggestions: filtered.map((a: string) => ({
          label: a,
          detail: "block entrance animation",
          insertValue: `${a} -->`,
          type: "directive" as const,
        })),
        query: q,
        replaceLen: q.length,
      };
    }


    return { suggestions: [] as SuggestionItem[], query: "", replaceLen: 0 };
  })();

  useEffect(() => {
    setSelectedIdx(0);
  }, [suggestions.length, query]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!suggestions.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => (i + 1) % suggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const cur = suggestions[selectedIdx];
        if (cur) onSelect(cur.insertValue, replaceLen);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [suggestions, selectedIdx, onSelect, replaceLen, onClose]);

  if (!suggestions.length || !position) return null;

  return (
    <div
      ref={containerRef}
      className="fixed z-50 flex max-h-56 w-64 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/95 shadow-2xl backdrop-blur-md"
      style={{ left: Math.min(position.x, window.innerWidth - 270), top: position.y }}
    >
      <div className="flex items-center gap-1.5 border-b border-zinc-800/80 px-3 py-1.5 text-[11px] font-semibold text-zinc-400">
        <Icon name="sparkle" className="text-blue-400 text-xs" />
        <span>Suggestions</span>
      </div>
      <div className="flex-1 overflow-y-auto p-1">
        {suggestions.map((item, idx) => (
          <button
            key={item.label}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(item.insertValue, replaceLen);
            }}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors",
              idx === selectedIdx ? "bg-blue-600 text-white font-medium" : "text-zinc-300 hover:bg-zinc-800"
            )}
          >
            <span className="font-mono">{item.label}</span>
            {item.detail && (
              <span className={cn("text-[10px]", idx === selectedIdx ? "text-blue-100" : "text-zinc-500")}>
                {item.detail}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
