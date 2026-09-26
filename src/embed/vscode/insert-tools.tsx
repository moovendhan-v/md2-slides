"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/common/icon";
import { IconPicker } from "@/components/common/icon-picker";
import { useEditor } from "@/stores/editor";
import { useUi } from "@/stores/ui";
import { onHost, post } from "./bridge";

const tool = "flex h-8 items-center gap-1.5 rounded-md px-2 text-[13px] text-zinc-300 hover:bg-zinc-900";

/**
 * Insert with previews from the VS Code slides panel: a new slide from the
 * layout gallery, a block from the snippet inserter, or an icon from the
 * catalog. Inserts land at the text editor's cursor. The same actions run
 * from VS Code commands (md2slides: Insert Slide / Block / Icon).
 */
export function InsertTools() {
  const blockBtn = useRef<HTMLButtonElement>(null);
  const [iconOpen, setIconOpen] = useState(false);

  const newSlide = () => useUi.getState().openModal("newSlide");
  const insertBlock = () => {
    const r = blockBtn.current?.getBoundingClientRect();
    useEditor.getState().set({ insertOpen: true, syntaxOpen: false, insertAt: { x: r?.left ?? 12, y: (r?.bottom ?? 44) + 6 } });
  };

  useEffect(
    () =>
      onHost((m) => {
        if (m.type === "newSlide") newSlide();
        else if (m.type === "insertBlock") insertBlock();
        else if (m.type === "pickIcon") setIconOpen(true);
      }),
    [],
  );

  return (
    <div className="flex items-center" role="group" aria-label="Insert">
      <button type="button" onClick={newSlide} className={tool} title="Insert a new slide after the one at the cursor (pick a layout from previews)">
        <Icon name="plus" /> <span className="hidden md:inline">Slide</span>
      </button>
      <button ref={blockBtn} type="button" onClick={insertBlock} className={tool} title="Insert a block at the cursor (with live previews)">
        <Icon name="plus-square" /> <span className="hidden md:inline">Block</span>
      </button>
      <IconPicker open={iconOpen} onOpenChange={setIconOpen} onSelect={(name) => post({ type: "insertText", text: `:${name}:` })}>
        <button type="button" className={tool} title="Insert an icon at the cursor (:name:)">
          <Icon name="smiley" /> <span className="hidden md:inline">Icon</span>
        </button>
      </IconPicker>
    </div>
  );
}
