/**
 * Messages between the VS Code extension host and the Slidewise webview.
 * Shared by both sides (`vscode-extension/src` imports this file).
 */

export interface EmbedSettings {
  /** Initial pane: rendered slides or the draggable component view. */
  view: "preview" | "blocks";
}

/** Extension → webview. */
export type HostMessage =
  | { type: "init"; text: string; fileName: string; settings: EmbedSettings }
  | { type: "update"; text: string }
  | { type: "cursor"; line: number }
  | { type: "present" }
  /** Open the new-slide gallery (inserts after the slide at the cursor). */
  | { type: "newSlide" }
  /** Open the block inserter (inserts at the cursor line). */
  | { type: "insertBlock" }
  /** Open the icon catalog (inserts `:name:` at the cursor). */
  | { type: "pickIcon" };

/** Webview → extension. */
export type WebviewMessage =
  | { type: "ready" }
  | { type: "edit"; text: string }
  | { type: "reveal"; line: number }
  /** Insert text at the text editor's cursor (e.g. an inline `:icon:`). */
  | { type: "insertText"; text: string }
  | { type: "openExternal"; url: string };
