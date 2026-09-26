import * as vscode from "vscode";
import { bindWebview } from "./bind";

/** One Slidewise side panel per Markdown file, reused when opened again. */
export class SlidePanels implements vscode.Disposable {
  private readonly panels = new Map<string, vscode.WebviewPanel>();

  constructor(private readonly extensionUri: vscode.Uri) {}

  open(document: vscode.TextDocument, present = false) {
    const key = document.uri.toString();
    const existing = this.panels.get(key);
    if (existing) {
      existing.reveal(vscode.ViewColumn.Beside);
      if (present) void existing.webview.postMessage({ type: "present" });
      return;
    }
    const name = document.uri.path.split("/").pop() ?? "deck";
    const panel = vscode.window.createWebviewPanel("slidewise.preview", `Slides · ${name}`, { viewColumn: vscode.ViewColumn.Beside, preserveFocus: !present }, { retainContextWhenHidden: true });
    panel.iconPath = vscode.Uri.joinPath(this.extensionUri, "media", "icon.png");
    const binding = bindWebview(panel.webview, document, this.extensionUri, { present });
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
