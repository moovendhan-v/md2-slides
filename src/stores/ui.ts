import { create } from "zustand";

export type View = "editor" | "studio" | "templates" | "repo" | "profile";
export type Modal = "palette" | "commit" | "ai" | "newSlide" | "share" | "export" | "repos" | null;
export type CustomTab = "style" | "canvas" | "type" | "slide" | "motion" | "deck";

interface UiState {
  view: View;
  repoView: string | null;
  sidebarOpen: boolean;
  customOpen: boolean;
  customTab: CustomTab;
  /** Narrow screens show one pane at a time. */
  pane: "editor" | "preview";
  previewOn: boolean;
  stripOn: boolean;
  previewMode: "all" | "focus";
  modal: Modal;
  width: number;
  printing: boolean;
  setView: (view: View, repoView?: string | null) => void;
  set: (patch: Partial<Omit<UiState, "set" | "setView" | "openModal" | "closeModal">>) => void;
  openModal: (m: Exclude<Modal, null>) => void;
  closeModal: () => void;
}

export const useUi = create<UiState>((set) => ({
  view: "repo",
  repoView: null,
  sidebarOpen: true,
  customOpen: true,
  customTab: "style",
  pane: "editor",
  previewOn: true,
  stripOn: true,
  previewMode: "all",
  modal: null,
  width: 1400,
  printing: false,
  setView: (view, repoView) => set((s) => ({ view, repoView: repoView === undefined ? s.repoView : repoView, sidebarOpen: s.width > 760 ? s.sidebarOpen : false })),
  set: (patch) => set(patch),
  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),
}));

export const useIsNarrow = () => useUi((s) => s.width < 1000);
