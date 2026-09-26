"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import type { TemplateRecord } from "@/engine/types";
import { buildFrontMatter, stripFrontMatter } from "@/domain/source/frontmatter";
import { useDeck } from "@/app-shell/deck-context";
import { useEditor } from "@/stores/editor";
import { useUi } from "@/stores/ui";
import { selectChanged, useWorkspace } from "@/stores/workspace";
import { useSaveTemplate } from "./use-queries";

const LOOK_KEYS = ["theme", "mode", "accent", "bg", "glass", "font", "radius", "density"];

/** File-level actions: open, create from template, save as template, export. */
export function useFileActions() {
  const active = useDeck();
  const saveTemplate = useSaveTemplate();
  return useMemo(() => {
    const ui = useUi.getState;
    const openFile = (key: string) => {
      useWorkspace.getState().openFile(key);
      useEditor.getState().set({ curLine: 0, pick: null, jump: { line: 0, nonce: Date.now() } });
      ui().set({ view: "editor", pane: "editor", modal: null, sidebarOpen: ui().width > 760 ? ui().sidebarOpen : false });
    };

    const createFromTemplate = (t: Pick<TemplateRecord, "id" | "name" | "md" | "look">) => {
      const look = Object.fromEntries(Object.entries(t.look ?? {}).map(([k, v]) => [k === "palette" ? "theme" : k, v]));
      const content = `${buildFrontMatter({ title: t.name, ...look })}\n${t.md}\n`;
      const key = useWorkspace.getState().createFile(active.repo, `decks/${t.id}`, content);
      openFile(key);
      toast(`Created ${key.split("::")[1]} from “${t.name}”`);
    };

    return {
      openFile,
      createFromTemplate,
      newDeck: () => createFromTemplate({ id: "untitled", name: "Untitled deck", look: {}, md: "^ Kicker\n# Untitled deck\nStart typing. Type / on an empty line to insert a block." }),
      saveAsTemplate: async (publish = false) => {
        const m = active.deck.meta;
        const look: TemplateRecord["look"] = {};
        LOOK_KEYS.forEach((k) => m[k] != null && (look[k === "theme" ? "palette" : k] = k === "glass" ? m[k] === "true" : m[k]));
        const t: TemplateRecord = { id: `mine-${Date.now()}`, name: m.title || active.path.split("/").pop() || "My deck", cat: "Engineering", author: "You", md: stripFrontMatter(active.src), stars: 0, community: true, look };
        await saveTemplate.mutateAsync(t);
        ui().set({ view: "templates", modal: null });
        toast(publish ? "Saved & opened a pull request on slidewise/community-templates" : "Saved to Community as a template");
      },
      download: () => {
        const blob = new Blob([active.src], { type: "text/markdown" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = active.path.split("/").pop() || "deck.md";
        a.click();
        URL.revokeObjectURL(a.href);
        ui().closeModal();
        toast(`Downloaded ${a.download}`);
      },
      exportPdf: () => {
        ui().set({ printing: true, modal: null });
        setTimeout(() => {
          window.print();
          setTimeout(() => ui().set({ printing: false }), 400);
        }, 700);
      },
      changedKeys: () => selectChanged(useWorkspace.getState()),
    };
  }, [active, saveTemplate]);
}
