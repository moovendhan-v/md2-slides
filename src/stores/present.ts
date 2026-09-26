import { create } from "zustand";

export const ZOOMS = ["fit", "100%", "130%", "160%"] as const;

interface PresentState {
  active: boolean;
  index: number;
  click: number;
  startedAt: number;
  limitMin: number;
  pen: boolean;
  penColor: string;
  laser: boolean;
  black: boolean;
  zoom: (typeof ZOOMS)[number];
  strip: boolean;
  overview: boolean;
  /** Increments to ask the ink canvas to clear. */
  inkClear: number;
  start: (index: number, overview?: boolean) => void;
  stop: () => void;
  goTo: (index: number, click?: number) => void;
  set: (patch: Partial<Omit<PresentState, "set" | "start" | "stop" | "goTo" | "cycleZoom">>) => void;
  cycleZoom: () => void;
}

export const usePresent = create<PresentState>((set) => ({
  active: false,
  index: 0,
  click: 0,
  startedAt: 0,
  limitMin: 0,
  pen: false,
  penColor: "#ef4444",
  laser: false,
  black: false,
  zoom: "fit",
  strip: true,
  overview: false,
  inkClear: 0,
  start: (index, overview = false) => set({ active: true, index, click: 0, startedAt: Date.now(), overview }),
  stop: () => set({ active: false, pen: false, laser: false, black: false, overview: false }),
  goTo: (index, click = 0) => set((s) => ({ index, click, inkClear: s.inkClear + 1 })),
  set: (patch) => set(patch),
  cycleZoom: () => set((s) => ({ zoom: ZOOMS[(ZOOMS.indexOf(s.zoom) + 1) % ZOOMS.length] })),
}));
