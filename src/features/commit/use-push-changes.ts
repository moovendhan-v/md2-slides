"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { formatSource } from "@/domain/source/slides";
import { useCommitMutation } from "@/hooks/use-queries";
import { pref, useSession } from "@/stores/session";
import { selectChanged, splitKey, useWorkspace } from "@/stores/workspace";

/** Push every changed file, one commit (or PR) per repository. Returns true on success. */
export function usePushChanges() {
  const commit = useCommitMutation();
  const push = useCallback(async () => {
    const ws = useWorkspace.getState();
    const { prefs, commitMessage } = useSession.getState();
    const keys = selectChanged(ws);
    if (!keys.length) {
      toast("Working tree clean — nothing to commit");
      return true;
    }
    const fmt = pref(prefs, "fmtSave", true);
    const asPullRequest = pref(prefs, "usePR", false);
    const byRepo = Object.groupBy(keys, (k) => splitKey(k).repo);
    try {
      for (const [repo, list = []] of Object.entries(byRepo)) {
        const branch = ws.repos.find((r) => r.id === repo)?.branch ?? "main";
        const changes = list.map((k) => ({ path: splitKey(k).path, content: fmt ? formatSource(ws.files[k]) : ws.files[k] }));
        const res = await commit.mutateAsync({ repo, branch, message: commitMessage, asPullRequest, changes });
        if (res.pullRequest) toast(`Opened pull request #${res.pullRequest} on ${repo}`);
      }
      ws.markPushed(keys);
      toast(`Pushed ${keys.length} file${keys.length > 1 ? "s" : ""} — “${commitMessage}”`);
      return true;
    } catch (e) {
      toast.error(`Push failed: ${(e as Error).message}`);
      return false;
    }
  }, [commit]);
  return { push, pending: commit.isPending };
}
