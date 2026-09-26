"use client";

import { useEffect } from "react";
import { AppHeader } from "@/components/shell/app-header";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { BootScreen } from "@/components/shell/boot-screen";
import { AiDialog } from "@/features/ai/ai-dialog";
import { CommandPalette } from "@/features/palette/command-palette";
import { CommitDialog } from "@/features/commit/commit-dialog";
import { EditorView } from "@/features/editor/editor-view";
import { NewSlideDialog } from "@/features/editor/new-slide-dialog";
import { PrintRoot } from "@/features/present/print-root";
import { Presenter } from "@/features/present/presenter";
import { ProfileView } from "@/features/profile/profile-view";
import { RepoView } from "@/features/repo/repo-view";
import { StudioView } from "@/features/studio/studio-view";
import { TemplatesView } from "@/features/templates/templates-view";
import { useGlobalKeys } from "@/hooks/use-global-keys";
import { useReposQuery } from "@/hooks/use-queries";
import { usePresent } from "@/stores/present";
import { useUi, type View } from "@/stores/ui";
import { fileKey, useWorkspace } from "@/stores/workspace";
import { DeckProvider } from "./deck-context";

const INITIAL = { repo: "acme/platform-decks", path: "decks/q3-review.md" };

/** View registry: adding a screen means adding one entry here. */
const VIEWS: Record<View, () => React.ReactNode> = {
  editor: () => <EditorView />,
  studio: () => <StudioView />,
  templates: () => <TemplatesView />,
  repo: () => <RepoView />,
  profile: () => <ProfileView />,
};

function Shell() {
  useGlobalKeys();
  const view = useUi((s) => s.view);
  const presenting = usePresent((s) => s.active);
  const printing = useUi((s) => s.printing);
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-zinc-950">
      <AppHeader />
      <div className="relative flex min-h-0 flex-1">
        <AppSidebar />
        <main className="flex min-w-0 flex-1 flex-col">{VIEWS[view]()}</main>
      </div>
      <CommandPalette />
      <CommitDialog />
      <AiDialog />
      <NewSlideDialog />
      {presenting && <Presenter />}
      {printing && <PrintRoot />}
    </div>
  );
}

export function Workspace() {
  const ready = useWorkspace((s) => s.ready);
  const repos = useReposQuery(!ready);
  useEffect(() => {
    if (repos.data && !useWorkspace.getState().ready) {
      const first = repos.data.find((r) => r.id === INITIAL.repo) ?? repos.data[0];
      const path = first.files.some((f) => f.path === INITIAL.path) ? INITIAL.path : first.files.find((f) => f.path.endsWith(".md"))?.path ?? "";
      useWorkspace.getState().hydrate(repos.data, fileKey(first.id, path));
      useUi.getState().set({ repoView: first.id });
    }
  }, [repos.data]);
  if (repos.isError) return <BootScreen label={`Could not load repositories: ${(repos.error as Error).message}`} />;
  if (!ready) return <BootScreen label="Loading repositories…" />;
  return (
    <DeckProvider>
      <Shell />
    </DeckProvider>
  );
}
