import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthStatus = "signin" | "consent" | "loading" | "in";

export interface ShareSettings {
  exp: "1h" | "24h" | "7d" | "talk";
  access: "link" | "org" | "pass";
  pw: string;
  follow: boolean;
  notes: boolean;
  dl: boolean;
  qa: boolean;
  tok: string;
}

interface SessionState {
  status: AuthStatus;
  mode: "in" | "up";
  scope: "all" | "selected";
  picked: Record<string, boolean>;
  /** User preferences (repo visibility, workflow toggles). */
  prefs: Record<string, boolean>;
  share: ShareSettings;
  commitMessage: string;
  set: (patch: Partial<Omit<SessionState, "set" | "togglePref" | "setShare">>) => void;
  togglePref: (key: string, fallback: boolean) => void;
  setShare: (patch: Partial<ShareSettings>) => void;
}

/** Signed-in session, preferences and share settings (persisted per browser). */
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      status: "signin",
      mode: "in",
      scope: "selected",
      picked: {},
      prefs: {},
      share: { exp: "24h", access: "link", pw: "", follow: true, notes: false, dl: true, qa: false, tok: "k7x2qa" },
      commitMessage: "Update slides",
      set: (patch) => set(patch),
      togglePref: (key, fallback) => set((s) => ({ prefs: { ...s.prefs, [key]: !(s.prefs[key] ?? fallback) } })),
      setShare: (patch) => set((s) => ({ share: { ...s.share, ...patch } })),
    }),
    { name: "slidewise-session", partialize: (s) => ({ status: s.status === "in" ? "in" : "signin", prefs: s.prefs, share: s.share, scope: s.scope, picked: s.picked }) },
  ),
);

export const pref = (prefs: Record<string, boolean>, key: string, fallback: boolean) => prefs[key] ?? fallback;
