"use client";

import type { TemplateRecord } from "@/engine/types";
import { Icon } from "@/components/common/icon";
import { SlideView } from "@/components/slide/slide-view";
import { useTemplateDeck } from "./use-template-look";

export function TemplateCard({ template: t, onOpen }: { template: TemplateRecord; onOpen: () => void }) {
  const parsed = useTemplateDeck(t);
  const first = parsed?.deck.slides[0];
  return (
    <button type="button" onClick={onOpen} className="group flex flex-col gap-3 rounded-xl border border-zinc-800 p-3 text-left transition-colors hover:border-zinc-600">
      <div className="overflow-hidden rounded-lg">{first && parsed && <SlideView slide={first} index={0} total={1} look={parsed.look} />}</div>
      <div className="flex items-start justify-between gap-2 px-1">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[13px] font-medium text-zinc-50">{t.name}</span>
          <span className="truncate text-xs text-zinc-500">
            {t.cat} · {parsed?.deck.slides.length ?? 0} slides · {t.author}
          </span>
        </div>
        {t.community && (
          <span className="flex shrink-0 items-center gap-1 text-xs text-zinc-400">
            <Icon name="star" /> {t.stars ?? 0}
          </span>
        )}
      </div>
    </button>
  );
}
