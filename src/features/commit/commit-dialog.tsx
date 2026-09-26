"use client";

import { useMemo, useState } from "react";
import { diffText } from "@/domain/source/diff";
import { formatSource } from "@/domain/source/slides";
import { Icon } from "@/components/common/icon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useFileActions } from "@/hooks/use-file-actions";
import { pref, useSession } from "@/stores/session";
import { useUi } from "@/stores/ui";
import { selectChanged, splitKey, useWorkspace } from "@/stores/workspace";
import { DiffView } from "./diff-view";
import { usePushChanges } from "./use-push-changes";

/** Review changed files (click one for its git-style diff) and push them as one commit per repo. */
export function CommitDialog() {
  const open = useUi((s) => s.modal === "commit");
  const close = useUi((s) => s.closeModal);
  const files = useWorkspace((s) => s.files);
  const orig = useWorkspace((s) => s.orig);
  const { commitMessage, prefs, set } = useSession();
  const { openFile } = useFileActions();
  const { push: pushChanges, pending } = usePushChanges();
  const fmt = pref(prefs, "fmtSave", true);
  const [openKey, setOpenKey] = useState<string | null>(null);
  // Diff exactly what will be pushed (formatted when "format on save" is on).
  const changes = useMemo(
    () =>
      open
        ? selectChanged({ files, orig }).map((k) => ({ key: k, ...splitKey(k), isNew: orig[k] == null, ...diffText(orig[k], fmt ? formatSource(files[k]) : files[k]) }))
        : [],
    [open, files, orig, fmt],
  );
  const shown = openKey ?? (changes.length === 1 ? changes[0].key : null);

  const push = async () => {
    if (await pushChanges()) close();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="border-zinc-800 bg-zinc-950 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Commit & push</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <Icon name="git-branch" /> main · {changes.length} changed file(s)
          </DialogDescription>
        </DialogHeader>
        {changes.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-zinc-400">Working tree clean — nothing to commit.</p>
        ) : (
          <div className="flex max-h-[55vh] flex-col overflow-y-auto rounded-lg border border-zinc-800">
            {changes.map((c) => (
              <div key={c.key} className="border-b border-zinc-900 last:border-0">
                <div className="group flex items-center hover:bg-zinc-900">
                  <button
                    type="button"
                    aria-expanded={shown === c.key}
                    onClick={() => setOpenKey(shown === c.key ? "" : c.key)}
                    className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-xs"
                  >
                    <Icon name="caret-right" className={`text-zinc-500 transition-transform ${shown === c.key ? "rotate-90" : ""}`} />
                    <span className={`w-3 font-mono font-bold ${c.isNew ? "text-green-400" : "text-amber-400"}`}>{c.isNew ? "A" : "M"}</span>
                    <span className="text-zinc-500">{c.repo.split("/")[1]}/</span>
                    <span className="flex-1 truncate text-zinc-200">{c.path}</span>
                    <span className="font-mono text-green-400">+{c.add}</span>
                    <span className="font-mono text-red-400">−{c.del}</span>
                  </button>
                  <button
                    type="button"
                    title="Open in editor"
                    aria-label={`Open ${c.path} in editor`}
                    onClick={() => {
                      openFile(c.key);
                      close();
                    }}
                    className="mr-1 flex size-7 items-center justify-center rounded text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100"
                  >
                    <Icon name="arrow-square-out" />
                  </button>
                </div>
                {shown === c.key && (
                  <div className="border-t border-zinc-900">
                    <DiffView hunks={c.hunks} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <label className="flex flex-col gap-1.5 text-xs text-zinc-400">
          Message
          <Input value={commitMessage} onChange={(e) => set({ commitMessage: e.target.value })} onKeyDown={(e) => e.key === "Enter" && push()} className="h-9 border-zinc-800 text-[13px]" />
        </label>
        <DialogFooter>
          <Button variant="outline" className="border-zinc-800" onClick={close}>
            Cancel
          </Button>
          <Button className="gap-1.5 bg-zinc-50 font-semibold text-zinc-950 hover:bg-zinc-200" disabled={pending} onClick={push}>
            <Icon name={pending ? "circle-notch" : "arrow-up"} className={pending ? "animate-spin" : ""} />
            {pref(prefs, "usePR", false) ? "Open pull request" : "Push to GitHub"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
