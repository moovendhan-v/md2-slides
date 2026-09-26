"use client";

import { useMemo } from "react";
import { useSession } from "@/stores/session";
import { useWorkspace } from "@/stores/workspace";
import { useMeQuery } from "./use-queries";

/** Repos the signed-in user chose to work with (only these are shown or loaded). */
export function useSelectedRepos() {
  const login = useMeQuery().data?.user?.login ?? "";
  const ids = useSession((s) => s.selectedRepos[login]);
  const all = useWorkspace((s) => s.repos);
  const repos = useMemo(() => (ids ? all.filter((r) => ids.includes(r.id)) : []), [all, ids]);
  return { login, repos, ids: ids ?? [], hasChosen: ids !== undefined && ids.length > 0 };
}
