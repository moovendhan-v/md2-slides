"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useServices } from "@/app-shell/services";
import { queryKeys } from "@/hooks/use-queries";
import { splitKey, useWorkspace } from "@/stores/workspace";

/**
 * Hook to sync/refresh the workspace and active deck with the latest
 * state from GitHub (refreshes file trees and active file content).
 */
export function useSync() {
  const [syncing, setSyncing] = useState(false);
  const qc = useQueryClient();
  const { git } = useServices();

  const sync = async (showToast = true) => {
    if (syncing) return;
    setSyncing(true);
    const t = showToast ? toast.loading("Syncing latest changes from GitHub…") : undefined;

    try {
      const ws = useWorkspace.getState();
      const repos = ws.repos;
      const activeKey = ws.activeKey;
      const { repo: activeRepoId, path: activePath } = splitKey(activeKey);

      // 1. Invalidate repo list query
      await qc.invalidateQueries({ queryKey: queryKeys.repos });

      // 2. Fetch latest file trees for all connected repos
      for (const r of repos) {
        try {
          const treeData = await git.listPaths(r.id, r.branch);
          ws.setPaths(r.id, treeData.paths);
          qc.setQueryData(queryKeys.tree(r.id, r.branch), treeData);
        } catch {}
      }

      // 3. If there is an active file, fetch its fresh content from remote
      if (activeRepoId && activePath) {
        const repoObj = repos.find((r) => r.id === activeRepoId);
        const branch = repoObj?.branch ?? "main";
        try {
          const freshContent = await git.readFile(activeRepoId, activePath, branch);
          ws.reloadFile(activeKey, freshContent);
          qc.setQueryData(queryKeys.file(activeRepoId, activePath, branch), freshContent);
        } catch (e) {
          console.warn("Failed to reload active file:", e);
        }
      }

      if (showToast && t) {
        toast.success("Synced with GitHub", { id: t });
      }
    } catch (err) {
      if (showToast && t) {
        toast.error(`Sync failed: ${(err as Error).message}`, { id: t });
      }
    } finally {
      setSyncing(false);
    }
  };

  return { sync, syncing };
}
