"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { TemplateFilter, TemplateRecord } from "@/engine/types";
import { useServices } from "@/app-shell/services";
import type { CommitRequest, GitProvider, Repo } from "@/services/git/types";
import { fileKey, useWorkspace } from "@/stores/workspace";

export const queryKeys = {
  me: ["me"] as const,
  repos: ["repos"] as const,
  tree: (repo: string, branch: string) => ["tree", repo, branch] as const,
  file: (repo: string, path: string, ref: string) => ["file", repo, path, ref] as const,
  templates: (f: TemplateFilter) => ["templates", f] as const,
  templatesAll: ["templates"] as const,
  aiHealth: ["ai-health"] as const,
};

export function useMeQuery() {
  const { auth } = useServices();
  return useQuery({ queryKey: queryKeys.me, queryFn: () => auth.me(), staleTime: 5 * 60_000 });
}

export function useReposQuery(enabled: boolean) {
  const { git } = useServices();
  const q = useQuery({ queryKey: queryKeys.repos, queryFn: () => git.listRepos(), enabled, staleTime: 5 * 60_000 });
  useEffect(() => {
    if (q.data) useWorkspace.getState().setRepos(q.data);
  }, [q.data]);
  return q;
}

/** A repo's file tree, synced into the workspace when it arrives. */
export function useRepoTree(repo: Repo | undefined, enabled = true) {
  const { git } = useServices();
  const q = useQuery({
    queryKey: queryKeys.tree(repo?.id ?? "", repo?.branch ?? ""),
    queryFn: () => git.listPaths(repo!.id, repo!.branch),
    enabled: !!repo && enabled,
    staleTime: 60_000,
  });
  useEffect(() => {
    if (q.data && repo) useWorkspace.getState().setPaths(repo.id, q.data.paths);
  }, [q.data, repo]);
  return q;
}

/** Fetch a file (cached by TanStack Query) and add it to the workspace. */
export async function ensureFile(qc: QueryClient, git: GitProvider, repo: Repo, path: string) {
  const key = fileKey(repo.id, path);
  if (useWorkspace.getState().files[key] != null) return key;
  const text = await qc.fetchQuery({ queryKey: queryKeys.file(repo.id, path, repo.branch), queryFn: () => git.readFile(repo.id, path, repo.branch), staleTime: 60_000 });
  useWorkspace.getState().loadFile(key, text);
  return key;
}

/** Paged template search, executed by the Wasm store (or the API route). */
export function useTemplatesQuery(filter: TemplateFilter) {
  const { templates } = useServices();
  return useQuery({ queryKey: queryKeys.templates(filter), queryFn: () => templates.query(filter), placeholderData: keepPreviousData });
}

/** Ping the server's AI endpoint (cached for a minute; `refetch` re-checks). */
export function useAiHealthQuery(enabled: boolean) {
  const { ai } = useServices();
  return useQuery({ queryKey: queryKeys.aiHealth, queryFn: () => ai.health(), enabled, staleTime: 60_000, retry: false });
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CommitRequest) => git.commit(req),
    onSuccess: (_r, req) => qc.invalidateQueries({ queryKey: ["tree", req.repo] }),
  });
}
