import * as vscode from "vscode";
import type { EmbedSettings, HostMessage, WebviewMessage } from "../../src/embed/vscode/protocol";
import { webviewHtml } from "./html";

export interface BindOptions {
  /** Messages to send once the webview has loaded the deck (e.g. present, newSlide). */
  afterInit?: HostMessage[];
}

const settings = (): EmbedSettings => ({ view: vscode.workspace.getConfiguration("slidewise").get("defaultView", "preview") });

/** Replace the whole document with `text` (no-op when unchanged). */
async function applyText(document: vscode.TextDocument, text: string) {
  if (document.getText() === text) return;
  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), text);
  await vscode.workspace.applyEdit(edit);
}

/** Reveal `line` in the text editor showing `document`, opening one beside if needed. */
async function reveal(document: vscode.TextDocument, line: number) {
  const pos = new vscode.Position(Math.min(line, document.lineCount - 1), 0);
  const shown = vscode.window.visibleTextEditors.find((e) => e.document === document);
  const editor = shown ?? (await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.One, preserveFocus: false }));
  editor.selection = new vscode.Selection(pos, pos);
  editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
}

/** Insert `text` at the cursor of the editor showing `document` (or its last known cursor). */
async function insertText(document: vscode.TextDocument, fallback: vscode.Position, text: string) {
  const editor = vscode.window.visibleTextEditors.find((e) => e.document === document);
  if (editor) {
    await editor.edit((b) => b.insert(editor.selection.active, text));
    return;
  }
  const edit = new vscode.WorkspaceEdit();
  edit.insert(document.uri, fallback, text);
  await vscode.workspace.applyEdit(edit);
}

/**
 * Connect a webview to a Markdown document: render the md2slides app, keep
 * both sides in sync (the document is the source of truth), and follow the
 * text cursor. Shared by the side panel and the custom editor.
 */
export function bindWebview(webview: vscode.Webview, document: vscode.TextDocument, extensionUri: vscode.Uri, opts: BindOptions = {}): vscode.Disposable {
  const folders = (vscode.workspace.workspaceFolders ?? []).map((f) => f.uri);
  webview.options = { enableScripts: true, localResourceRoots: [vscode.Uri.joinPath(extensionUri, "dist"), vscode.Uri.joinPath(document.uri, ".."), ...folders] };
  webview.html = webviewHtml(webview, extensionUri, document);

  const send = (m: HostMessage) => void webview.postMessage(m);
  let pending = Promise.resolve();
  let cursor = vscode.window.visibleTextEditors.find((e) => e.document === document)?.selection.active ?? new vscode.Position(0, 0);

  const subs = [
    webview.onDidReceiveMessage((m: WebviewMessage) => {
      if (m.type === "ready") {
        send({ type: "init", text: document.getText(), fileName: vscode.workspace.asRelativePath(document.uri), settings: settings() });
        send({ type: "cursor", line: cursor.line });
        for (const msg of opts.afterInit ?? []) send(msg);
      } else if (m.type === "edit") pending = pending.then(() => applyText(document, m.text));
      else if (m.type === "reveal") void reveal(document, m.line);
      else if (m.type === "insertText") pending = pending.then(() => insertText(document, cursor, m.text));
      else if (m.type === "openExternal") void vscode.env.openExternal(vscode.Uri.parse(m.url));
    }),
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document === document && e.contentChanges.length) send({ type: "update", text: document.getText() });
    }),
    vscode.window.onDidChangeTextEditorSelection((e) => {
      if (e.textEditor.document !== document) return;
      cursor = e.selections[0].active;
      send({ type: "cursor", line: cursor.line });
    }),
  ];
  return vscode.Disposable.from(...subs);
}
