import * as vscode from "vscode";
import { looksLikeDeck } from "./deck-detect";

type SuggestMode = "decks" | "always" | "never";

const isMarkdown = (d: vscode.TextDocument) => d.languageId === "markdown" && (d.uri.scheme === "file" || d.uri.scheme === "untitled" || d.uri.scheme === "vscode-remote");

/**
 * Offer to open Markdown decks as slides when they are opened in a text
 * editor: once per file per session, with a "Don't ask again" escape hatch.
 */
export function registerSuggestions(context: vscode.ExtensionContext, open: (d: vscode.TextDocument) => void) {
  const asked = new Set<string>();
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  status.text = "$(preview) Slides";
  status.tooltip = "Open this Markdown file as slides (Slidewise)";
  status.command = "slidewise.openPreview";

  const check = async (editor: vscode.TextEditor | undefined) => {
    const doc = editor?.document;
    if (!doc || !isMarkdown(doc)) return void status.hide();
    status.show();
    const mode = vscode.workspace.getConfiguration("slidewise").get<SuggestMode>("suggestOnOpen", "decks");
    const key = doc.uri.toString();
    if (mode === "never" || asked.has(key) || (mode === "decks" && !looksLikeDeck(doc.getText()))) return;
    asked.add(key);
    const name = doc.uri.path.split("/").pop();
    const pick = await vscode.window.showInformationMessage(`Open "${name}" as slides?`, "Open Slides", "Present", "Don't Ask Again");
    if (pick === "Open Slides") open(doc);
    else if (pick === "Present") void vscode.commands.executeCommand("slidewise.present", doc.uri);
    else if (pick === "Don't Ask Again") await vscode.workspace.getConfiguration("slidewise").update("suggestOnOpen", "never", vscode.ConfigurationTarget.Global);
  };

  context.subscriptions.push(status, vscode.window.onDidChangeActiveTextEditor(check));
  void check(vscode.window.activeTextEditor);
}
