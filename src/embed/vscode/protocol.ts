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
  | { type: "present" };

/** Webview → extension. */
export type WebviewMessage =
  | { type: "ready" }
  | { type: "edit"; text: string }
  | { type: "reveal"; line: number }
  | { type: "openExternal"; url: string };
