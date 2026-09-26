"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/common/icon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSelectedRepos } from "@/hooks/use-selected-repos";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import { useSession } from "@/stores/session";
import { useUi } from "@/stores/ui";
import { useWorkspace } from "@/stores/workspace";

/** Choose which repositories md2slides shows. Nothing else is loaded. */
export function RepoPickerDialog() {
  const open = useUi((s) => s.modal === "repos");
  const close = useUi((s) => s.closeModal);
  const all = useWorkspace((s) => s.repos);
  const { login, ids } = useSelectedRepos();
  const selectRepos = useSession((s) => s.selectRepos);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  useEffect(() => {
    if (open) setPicked(new Set(ids));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the dialog opens
  }, [open]);
  const shown = useMemo(() => all.filter((r) => r.id.toLowerCase().includes(q.toLowerCase())), [all, q]);
  const toggle = (id: string) => setPicked((p) => {
    const n = new Set(p);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  });
  const save = () => {
    const chosen = all.filter((r) => picked.has(r.id)).map((r) => r.id);
    selectRepos(login, chosen);
    const ui = useUi.getState();
    if (!ui.repoView || !chosen.includes(ui.repoView)) ui.set({ repoView: chosen[0] ?? null });
    ui.setView("repo");
    close();
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="flex max-h-[85vh] flex-col border-zinc-800 bg-zinc-950 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose repositories</DialogTitle>
          <DialogDescription>Only the repositories you select appear in md2slides. Files load when you open a repository.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Icon name="magnifying-glass" className="absolute top-1/2 left-3 -translate-y-1/2 text-zinc-500" />
          <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${all.length} repositories…`} className="h-9 border-zinc-800 pl-9 text-[13px]" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-zinc-800">
          {shown.length === 0 && <p className="p-4 text-center text-xs text-zinc-500">No repositories match.</p>}
          {shown.map((r) => {
            const on = picked.has(r.id);
            return (
              <button key={r.id} type="button" onClick={() => toggle(r.id)} className="flex w-full items-center gap-3 border-b border-zinc-900 px-3 py-2.5 text-left last:border-0 hover:bg-zinc-900/70">
                <span className={cn("grid size-4 shrink-0 place-items-center rounded border text-[10px] text-white", on ? "border-blue-500 bg-blue-500" : "border-zinc-600")}>{on ? "✓" : ""}</span>
                <Icon name={r.private ? "lock-simple" : "book-bookmark"} className="text-zinc-500" />
                <span className="min-w-0 flex-1 truncate text-[13px] text-zinc-100">{r.id}</span>
                <span className="shrink-0 text-[11px] text-zinc-500">{timeAgo(r.pushedAt)}</span>
              </button>
            );
          })}
        </div>
        <DialogFooter className="items-center sm:justify-between">
          <span className="text-xs text-zinc-500">{picked.size} selected</span>
          <div className="flex gap-2">
            {ids.length > 0 && (
              <Button variant="outline" className="border-zinc-800" onClick={close}>
                Cancel
              </Button>
            )}
            <Button className="bg-zinc-50 font-semibold text-zinc-950 hover:bg-zinc-200" disabled={!picked.size} onClick={save}>
              Use {picked.size || ""} {picked.size === 1 ? "repository" : "repositories"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
