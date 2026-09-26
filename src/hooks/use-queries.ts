"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TemplateFilter, TemplateRecord } from "@/engine/types";
import { useServices } from "@/app-shell/services";
import type { CommitRequest } from "@/services/git/types";

export const queryKeys = {
  repos: ["repos"] as const,
  templates: (f: TemplateFilter) => ["templates", f] as const,
  templatesAll: ["templates"] as const,
};

export function useReposQuery(enabled: boolean) {
  const { git } = useServices();
  return useQuery({ queryKey: queryKeys.repos, queryFn: () => git.listRepos(), enabled, staleTime: Infinity });
}

/** Paged template search, executed by the Wasm store (or the API route). */
export function useTemplatesQuery(filter: TemplateFilter) {
  const { templates } = useServices();
  return useQuery({ queryKey: queryKeys.templates(filter), queryFn: () => templates.query(filter), placeholderData: keepPreviousData });
}

export function useSaveTemplate() {
  const { templates } = useServices();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (t: TemplateRecord) => templates.save(t),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.templatesAll }),
  });
}

export function useCommitMutation() {
  const { git } = useServices();
  return useMutation({ mutationFn: (req: CommitRequest) => git.commit(req) });
}
