"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/common/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDeck } from "@/app-shell/deck-context";
import { useServices } from "@/app-shell/services";
import { queryKeys } from "@/hooks/use-queries";
import { cn } from "@/lib/utils";
import { splitKey, useWorkspace } from "@/stores/workspace";

export function BranchSwitcher({ className }: { className?: string }) {
  const { repo: activeRepo } = useDeck();
  const repos = useWorkspace((s) => s.repos);
  const repo = repos.find((r) => r.id === activeRepo) || repos[0];
  const repoId = repo?.id ?? "";
  const currentBranch = repo?.branch ?? "main";

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [switching, setSwitching] = useState(false);

  const { git } = useServices();
  const qc = useQueryClient();

  const branchesQuery = useQuery({
    queryKey: ["branches", repoId],
    queryFn: () => git.listBranches(repoId),
    enabled: open && !!repoId,
    staleTime: 60_000,
  });

  const branches = branchesQuery.data ?? [currentBranch];

  const filtered = useMemo(() => {
    if (!search.trim()) return branches;
    const q = search.toLowerCase();
    return branches.filter((b) => b.toLowerCase().includes(q));
  }, [branches, search]);

  const handleSelectBranch = async (branchName: string) => {
    if (branchName === currentBranch) {
      setOpen(false);
      return;
    }

    setSwitching(true);
    const t = toast.loading(`Switching to ${branchName}…`);

    try {
      const ws = useWorkspace.getState();
      ws.setBranch(repoId, branchName);

      // 1. Fetch paths for this new branch
      const treeData = await git.listPaths(repoId, branchName);
      ws.setPaths(repoId, treeData.paths);
      qc.setQueryData(queryKeys.tree(repoId, branchName), treeData);

      // 2. If active file belongs to this repo, reload content from the new branch
      const activeKey = ws.activeKey;
      const { repo: fileRepo, path: filePath } = splitKey(activeKey);
      if (fileRepo === repoId && filePath) {
        try {
          const content = await git.readFile(repoId, filePath, branchName);
          ws.reloadFile(activeKey, content);
          qc.setQueryData(queryKeys.file(repoId, filePath, branchName), content);
        } catch (e) {
          console.warn("Could not reload file on new branch:", e);
        }
      }

      toast.success(`Switched to branch ${branchName}`, { id: t });
      setOpen(false);
    } catch (e) {
      toast.error(`Failed to switch branch: ${(e as Error).message}`, { id: t });
    } finally {
      setSwitching(false);
    }
  };

  if (!repoId) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={switching}
          className={cn(
            "flex items-center gap-1.5 rounded px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50 transition-colors",
            className,
          )}
          title={`Active branch: ${currentBranch} (Click to switch)`}
        >
          <Icon name="git-branch" className={cn(switching && "animate-spin text-blue-400")} />
          <span className="truncate max-w-[120px] font-mono">{currentBranch}</span>
          <Icon name="caret-down" className="text-[10px] text-zinc-500" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 border-zinc-800 bg-zinc-950 p-2 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <Icon name="git-branch" className="text-blue-400 text-sm" />
            <span className="text-xs font-semibold text-zinc-100">Switch Branch</span>
          </div>
          <span className="font-mono text-[10px] text-zinc-500">{branches.length} branches</span>
        </div>

        {branches.length > 4 && (
          <div className="mb-2">
            <input
              type="text"
              placeholder="Find branch…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 w-full rounded border border-zinc-800 bg-zinc-900 px-2 text-xs text-zinc-200 outline-none focus:border-zinc-600"
              autoFocus
            />
          </div>
        )}

        <div className="max-h-48 overflow-y-auto space-y-0.5">
          {branchesQuery.isLoading ? (
            <div className="py-4 text-center text-xs text-zinc-500">Loading branches…</div>
          ) : filtered.length === 0 ? (
            <div className="py-4 text-center text-xs text-zinc-500">No matching branches</div>
          ) : (
            filtered.map((b) => {
              const isCurrent = b === currentBranch;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => handleSelectBranch(b)}
                  className={cn(
                    "flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs font-mono transition-colors",
                    isCurrent ? "bg-blue-600/20 text-blue-300 font-medium" : "text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50",
                  )}
                >
                  <span className="truncate">{b}</span>
                  {isCurrent && <Icon name="check" className="text-xs text-blue-400 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
