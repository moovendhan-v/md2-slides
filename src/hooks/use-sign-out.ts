"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useServices } from "@/app-shell/services";
import { useWorkspace } from "@/stores/workspace";
import { queryKeys } from "./use-queries";

/** Clear the server session, local working copy and cached GitHub data. */
export function useSignOut() {
  const { auth } = useServices();
  const qc = useQueryClient();
  return useCallback(async () => {
    await auth.signOut().catch(() => undefined);
    useWorkspace.setState({ repos: [], files: {}, orig: {}, paths: {}, activeKey: "", expanded: {} });
    qc.removeQueries({ predicate: (q) => q.queryKey[0] !== "templates" });
    await qc.invalidateQueries({ queryKey: queryKeys.me });
  }, [auth, qc]);
}
