"use client";

import { useEffect, useState } from "react";
import { useEditor } from "@/stores/editor";
import { fileKey, useWorkspace } from "@/stores/workspace";
import { onHost, post } from "./bridge";
import type { EmbedSettings } from "./protocol";

/** Webview edits are batched this long before they are sent to the text document. */
const EDIT_DELAY = 120;

/**
 * Two-way sync between the VS Code text document and the workspace store.
 * The document is the single source of truth: host updates always win over
 * a pending local edit, and echoes of our own edits are ignored.
 */
export function useVscodeSync(): EmbedSettings | null {
  const [settings, setSettings] = useState<EmbedSettings | null>(null);

  useEffect(() => {
    let key = "";
    /** Text the document is known to hold. */
    let synced = "";
    let timer: ReturnType<typeof setTimeout> | undefined;

    const offHost = onHost((m) => {
      if (m.type === "init") {
        key = fileKey("vscode", m.fileName);
        synced = m.text;
        useWorkspace.setState({ files: { [key]: m.text }, orig: { [key]: m.text }, paths: { vscode: [m.fileName] }, activeKey: key });
        setSettings(m.settings);
      } else if (m.type === "update" && key) {
        clearTimeout(timer);
        synced = m.text;
        if (useWorkspace.getState().files[key] !== m.text) useWorkspace.setState((s) => ({ files: { ...s.files, [key]: m.text } }));
      } else if (m.type === "cursor") {
        if (useEditor.getState().curLine !== m.line) useEditor.getState().set({ curLine: m.line });
      }
    });

    const offEdits = useWorkspace.subscribe((s) => {
      const text = key ? s.files[key] : undefined;
      if (text == null || text === synced) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        synced = text;
        post({ type: "edit", text });
      }, EDIT_DELAY);
    });

    // "Jump to source" in the preview moves the VS Code cursor instead of a textarea.
    const offJumps = useEditor.subscribe((s, prev) => {
      if (s.jump && s.jump !== prev.jump) post({ type: "reveal", line: s.jump.line });
    });

    post({ type: "ready" });
    return () => {
      clearTimeout(timer);
      offHost();
      offEdits();
      offJumps();
    };
  }, []);

  return settings;
}
