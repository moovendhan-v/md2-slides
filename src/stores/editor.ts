import { create } from "zustand";
import type { Block } from "@/engine/types";

interface EditorState {
  curLine: number;
  /** Block selected in the preview for restyling. */
  pick: Block | null;
  /** Request for the textarea to focus/select a line (nonce re-triggers). */
  jump: { line: number; nonce: number } | null;
  insertOpen: boolean;
  insertAt: { x: number; y: number };
  snipHover: number;
  syntaxOpen: boolean;
  problemsOpen: boolean;
  /** Source pane shows raw Markdown or the draggable component view. */
  sourceView: "raw" | "blocks";
  transitionPick: { index: number; x: number; y: number } | null;
  /** Bump to replay animations in focus preview / motion tab. */
  focusSeed: number;
  motionSeed: number;
  set: (patch: Partial<Omit<EditorState, "set" | "jumpTo">>) => void;
  jumpTo: (line: number) => void;
}

export const useEditor = create<EditorState>((set) => ({
  curLine: 0,
  pick: null,
  jump: null,
  insertOpen: false,
  insertAt: { x: 12, y: 110 },
  snipHover: 0,
  syntaxOpen: false,
  problemsOpen: false,
  sourceView: "raw",
  transitionPick: null,
  focusSeed: 0,
  motionSeed: 0,
  set: (patch) => set(patch),
  jumpTo: (line) => set((s) => ({ curLine: Math.max(0, line), jump: { line: Math.max(0, line), nonce: (s.jump?.nonce ?? 0) + 1 } })),
}));
