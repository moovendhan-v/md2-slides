"use client";

import { toast } from "sonner";
import type { TemplateRecord } from "@/engine/types";
import { Icon } from "@/components/common/icon";
import { SlideView } from "@/components/slide/slide-view";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDeckActions } from "@/hooks/use-deck-actions";
import { useFileActions } from "@/hooks/use-file-actions";
import { useUi } from "@/stores/ui";
import { useWorkspace } from "@/stores/workspace";
import { useTemplateDeck } from "./use-template-look";

/** All slides of a template + "use as new deck" / "add to current deck". */
export function TemplatePreviewDialog({ template: t, onClose }: { template: TemplateRecord | null; onClose: () => void }) {
  const parsed = useTemplateDeck(t);
  const { createFromTemplate } = useFileActions();
  const { appendSlides } = useDeckActions();
  const current = useWorkspace((s) => s.activeKey.split("/").pop());
  if (!t || !parsed) return null;
  const add = () => {
    appendSlides(t.md);
    onClose();
    useUi.getState().setView("editor");
    toast(`Added “${t.name}” to ${current}`);
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[88vh] flex-col border-zinc-800 bg-zinc-950 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t.name}</DialogTitle>
          <DialogDescription>
            {t.cat} · by {t.author} · {parsed.deck.slides.length} slides
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
          {parsed.deck.slides.map((sl, i) => (
            <SlideView key={i} slide={sl} index={i} total={parsed.deck.slides.length} look={parsed.look} />
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-800 pt-3">
          <Button variant="outline" className="gap-1.5 border-zinc-800" onClick={add}>
            <Icon name="plus" /> Add to {current}
          </Button>
          <Button
            className="gap-1.5 bg-zinc-50 font-semibold text-zinc-950 hover:bg-zinc-200"
            onClick={() => {
              createFromTemplate(t);
              onClose();
            }}
          >
            <Icon name="file-plus" /> Use as new deck
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
