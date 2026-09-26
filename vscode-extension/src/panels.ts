import * as vscode from "vscode";
import type { HostMessage } from "../../src/embed/vscode/protocol";
import { bindWebview } from "./bind";

/** One md2slides side panel per Markdown file, reused when opened again. */
export class SlidePanels implements vscode.Disposable {
  private readonly panels = new Map<string, vscode.WebviewPanel>();

  constructor(private readonly extensionUri: vscode.Uri) {}

  /** Show the panel for `document` (creating it beside the editor) and optionally run an action in it. */
  open(document: vscode.TextDocument, action?: HostMessage) {
    const key = document.uri.toString();
    const existing = this.panels.get(key);
    if (existing) {
      existing.reveal(vscode.ViewColumn.Beside, !action);
      if (action) void existing.webview.postMessage(action);
      return;
    }
    const name = document.uri.path.split("/").pop() ?? "deck";
    const panel = vscode.window.createWebviewPanel("slidewise.preview", `Slides · ${name}`, { viewColumn: vscode.ViewColumn.Beside, preserveFocus: !action }, { retainContextWhenHidden: true });
    panel.iconPath = vscode.Uri.joinPath(this.extensionUri, "media", "icon.png");
    const binding = bindWebview(panel.webview, document, this.extensionUri, { afterInit: action ? [action] : [] });
    this.panels.set(key, panel);
    panel.onDidDispose(() => {
      binding.dispose();
      this.panels.delete(key);
    });
  }

  dispose() {
    for (const p of this.panels.values()) p.dispose();
  }
}
