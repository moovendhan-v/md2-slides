"use client";

import { CustomizePanel } from "@/features/customize/customize-panel";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { useFileActions } from "@/hooks/use-file-actions";
import { useIsNarrow, useUi } from "@/stores/ui";
import { useWorkspace } from "@/stores/workspace";
import { useEditor } from "@/stores/editor";
import { BlockPicker } from "./block-picker";
import { BlocksView } from "./blocks/blocks-view";
import { EditorToolbar } from "./editor-toolbar";
import { InsertMenu } from "./insert-menu";
import { MarkdownEditor } from "./markdown-editor";
import { PreviewPane } from "./preview-pane";
import { ProblemsBar } from "./problems-bar";
import { SlideStrip } from "./slide-strip";
import { SyntaxPanel } from "./syntax-panel";

/** Markdown | live preview | customizer, with the slide strip underneath. */
export function EditorView() {
  const narrow = useIsNarrow();
  const { pane, previewOn, stripOn, customOpen } = useUi();
  const showEditor = !narrow || pane === "editor";
  const showPreview = narrow ? pane === "preview" : previewOn;
  const hasFile = useWorkspace((s) => !!s.activeKey);
  const blocks = useEditor((s) => s.sourceView === "blocks");
  const { newDeck } = useFileActions();
  const setView = useUi((s) => s.setView);
  if (!hasFile)
    return (
      <EmptyState icon="note-pencil" title="No deck open" body="Open a .md file from a repository in the sidebar, or start a new deck — it is committed to GitHub on your next push.">
        <div className="flex gap-2">
          <Button variant="outline" className="border-zinc-800" onClick={() => setView("repo")}>Browse repositories</Button>
          <Button className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200" onClick={newDeck}>New deck</Button>
        </div>
      </EmptyState>
    );
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <EditorToolbar />
      <div className="relative flex min-h-0 flex-1">
        {stripOn && !narrow && <SlideStrip orientation="vertical" />}
        {showEditor && (
          <div className="relative flex min-w-0 flex-1 flex-col">
            {blocks ? <BlocksView /> : <MarkdownEditor />}
            <ProblemsBar />
            <SyntaxPanel />
          </div>
        )}
        {showPreview && <PreviewPane />}
        {customOpen && <CustomizePanel overlay={narrow} />}
      </div>
      {stripOn && narrow && <SlideStrip orientation="horizontal" />}
      <InsertMenu />
      <BlockPicker />
    </div>
  );
}
