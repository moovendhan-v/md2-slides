import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  /** User preferences (repo visibility, workflow toggles). */
  prefs: Record<string, boolean>;
  share: ShareSettings;
  commitMessage: string;
  set: (patch: Partial<Omit<SessionState, "set" | "togglePref" | "setShare">>) => void;
  togglePref: (key: string, fallback: boolean) => void;
  setShare: (patch: Partial<ShareSettings>) => void;
}

/**
 * Per-browser preferences. Authentication itself lives in the server's
 * encrypted httpOnly cookie and is read through `useMeQuery`.
 */
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      prefs: {},
      share: { exp: "24h", access: "link", pw: "", follow: true, notes: false, dl: true, qa: false, tok: Math.random().toString(36).slice(2, 8) },
      commitMessage: "Update slides",
      set: (patch) => set(patch),
      togglePref: (key, fallback) => set((s) => ({ prefs: { ...s.prefs, [key]: !(s.prefs[key] ?? fallback) } })),
      setShare: (patch) => set((s) => ({ share: { ...s.share, ...patch } })),
    }),
    { name: "slidewise-prefs", partialize: (s) => ({ prefs: s.prefs, share: s.share }) },
  ),
);

export const pref = (prefs: Record<string, boolean>, key: string, fallback: boolean) => prefs[key] ?? fallback;
