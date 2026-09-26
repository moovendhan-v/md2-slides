"use client";

import { CustomizePanel } from "@/features/customize/customize-panel";
import { useIsNarrow, useUi } from "@/stores/ui";
import { BlockPicker } from "./block-picker";
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
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <EditorToolbar />
      <div className="relative flex min-h-0 flex-1">
        {showEditor && (
          <div className="relative flex min-w-0 flex-1 flex-col">
            <MarkdownEditor />
            <ProblemsBar />
            <SyntaxPanel />
          </div>
        )}
        {showPreview && <PreviewPane />}
        {customOpen && <CustomizePanel overlay={narrow} />}
      </div>
      {stripOn && <SlideStrip />}
      <InsertMenu />
      <BlockPicker />
    </div>
  );
}
