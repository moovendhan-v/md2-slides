"use client";

import type { Block } from "@/engine/types";
import { rowCells } from "@/domain/deck/rows";
import { Icon } from "@/components/common/icon";
import { IconPicker } from "@/components/common/icon-picker";
import { useDeckActions } from "@/hooks/use-deck-actions";

/** One icon button per row of a cards/flow block, each opening the icon catalog. */
export function RowIcons({ block }: { block: Block }) {
  const actions = useDeckActions();
  const rows = (block.rows ?? []).map(rowCells);
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-zinc-400">Icons</span>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {rows.map(([icon, title], k) => (
          <IconPicker key={k} value={icon} onSelect={(name) => actions.setRowIcon(block, k, name)}>
            <button type="button" className="flex items-center gap-2.5 rounded-lg border border-zinc-800 px-2.5 py-1.5 text-left hover:border-zinc-600" aria-label={`Change icon for ${title || `row ${k + 1}`}`}>
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-zinc-900 text-lg text-zinc-100">
                <Icon name={icon} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs text-zinc-200">{title || `Row ${k + 1}`}</span>
                <span className="block truncate font-mono text-[10px] text-zinc-500">{icon || "no icon"}</span>
              </span>
              <Icon name="caret-down" className="text-[10px] text-zinc-500" />
            </button>
          </IconPicker>
        ))}
      </div>
    </div>
  );
}
