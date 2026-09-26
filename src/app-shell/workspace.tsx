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
import { DeckProvider } from "./deck-context";

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
  const repos = useReposQuery(true);
  useEffect(() => {
    const ui = useUi.getState();
    if (repos.data?.length && !ui.repoView) ui.set({ repoView: repos.data[0].id });
  }, [repos.data]);
  if (repos.isPending) return <BootScreen label="Loading your GitHub repositories…" />;
  if (repos.isError) return <BootScreen label={`Could not load repositories: ${repos.error.message}`} />;
  return (
    <DeckProvider>
      <Shell />
    </DeckProvider>
  );
}
