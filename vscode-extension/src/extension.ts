import * as vscode from "vscode";
import { SlideEditorProvider } from "./custom-editor";
import { SlidePanels } from "./panels";
import { registerSuggestions } from "./suggest";

/** Resolve the Markdown document a command targets (explorer/title URI, or the active editor). */
async function targetDocument(uri?: vscode.Uri): Promise<vscode.TextDocument | undefined> {
  if (uri instanceof vscode.Uri) return vscode.workspace.openTextDocument(uri);
  const doc = vscode.window.activeTextEditor?.document;
  if (doc?.languageId === "markdown") return doc;
  void vscode.window.showWarningMessage("Open a Markdown (.md) file first.");
  return undefined;
}

export function activate(context: vscode.ExtensionContext) {
  const panels = new SlidePanels(context.extensionUri);
  const open = (d: vscode.TextDocument) => panels.open(d);

  context.subscriptions.push(
    panels,
    vscode.commands.registerCommand("slidewise.openPreview", async (uri?: vscode.Uri) => {
      const doc = await targetDocument(uri);
      if (doc) panels.open(doc);
    }),
    ...(
      [
        ["slidewise.present", { type: "present" }],
        ["slidewise.insertSlide", { type: "newSlide" }],
        ["slidewise.insertBlock", { type: "insertBlock" }],
        ["slidewise.insertIcon", { type: "pickIcon" }],
      ] as const
    ).map(([id, action]) =>
      vscode.commands.registerCommand(id, async (uri?: vscode.Uri) => {
        const doc = await targetDocument(uri);
        if (doc) panels.open(doc, action);
      }),
    ),
    vscode.commands.registerCommand("slidewise.openInEditor", async (uri?: vscode.Uri) => {
      const doc = await targetDocument(uri);
      if (doc) await vscode.commands.executeCommand("vscode.openWith", doc.uri, SlideEditorProvider.viewType);
    }),
    vscode.window.registerCustomEditorProvider(SlideEditorProvider.viewType, new SlideEditorProvider(context.extensionUri), {
      webviewOptions: { retainContextWhenHidden: true },
    }),
  );
  registerSuggestions(context, open);
}

export function deactivate() {}
