import { create } from "zustand";

export type AiPhase = "idle" | "busy" | "done";
export type AiTarget = "new" | "insert" | "replace";

interface AiState {
  phase: AiPhase;
  step: number;
  prompt: string;
  count: number;
  target: AiTarget;
  typed: string;
  markdown: string;
  summary: string;
  error: string;
  runId: number;
  seed: number;
  set: (patch: Partial<Omit<AiState, "set">>) => void;
}

export const useAi = create<AiState>((set) => ({
  phase: "idle",
  step: 0,
  prompt: "",
  count: 6,
  target: "new",
  typed: "",
  markdown: "",
  summary: "",
  error: "",
  runId: 0,
  seed: 0,
  set: (patch) => set(patch),
}));
