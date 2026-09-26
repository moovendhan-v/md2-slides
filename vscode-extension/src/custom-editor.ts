import * as vscode from "vscode";
import { bindWebview } from "./bind";

/** "Open With… → Slidewise": the deck as slides in place of the text editor. */
export class SlideEditorProvider implements vscode.CustomTextEditorProvider {
  static readonly viewType = "slidewise.editor";

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveCustomTextEditor(document: vscode.TextDocument, panel: vscode.WebviewPanel) {
    const binding = bindWebview(panel.webview, document, this.extensionUri);
    panel.onDidDispose(() => binding.dispose());
  }
}
