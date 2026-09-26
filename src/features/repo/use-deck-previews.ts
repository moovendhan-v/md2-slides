"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect } from "react";
import { useServices } from "@/app-shell/services";
import { queryKeys } from "@/hooks/use-queries";
import type { Repo } from "@/services/git/types";
import { fileKey, useWorkspace } from "@/stores/workspace";

const MAX_PREVIEWS = 12;

/** Fetch the first Markdown files of a repo so the table can show titles and slide counts. */
export function useDeckPreviews(repo: Repo | undefined, paths: string[]) {
  const { git } = useServices();
  const md = repo ? paths.filter((p) => p.endsWith(".md")).slice(0, MAX_PREVIEWS) : [];
  const results = useQueries({
    queries: md.map((path) => ({
      queryKey: queryKeys.file(repo!.id, path, repo!.branch),
      queryFn: () => git.readFile(repo!.id, path, repo!.branch),
      staleTime: 60_000,
      enabled: useWorkspace.getState().orig[fileKey(repo!.id, path)] == null,
    })),
  });
  const signature = results.map((r) => r.dataUpdatedAt).join(",");
  useEffect(() => {
    results.forEach((r, i) => r.data != null && useWorkspace.getState().loadFile(fileKey(repo!.id, md[i]), r.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when fetched data changes
  }, [signature]);
}
