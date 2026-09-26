import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ExpiryKey } from "@/domain/share/payload";
import { migrateLocalStorageKey } from "@/lib/storage";

/** Share-link options (the password is never persisted). */
export interface ShareSettings {
  exp: ExpiryKey;
  notes: boolean;
  download: boolean;
  present: boolean;
}

// Keep preferences from before the rename (Slidewise → md2slides); runs before the store hydrates.
migrateLocalStorageKey("slidewise-prefs", "md2slides-prefs");

const DEFAULT_SHARE: ShareSettings = { exp: "7d", notes: false, download: true, present: false };

interface SessionState {
  /** User preferences (repo visibility, workflow toggles). */
  prefs: Record<string, boolean>;
  /** Repositories the user chose to work with, per GitHub login. */
  selectedRepos: Record<string, string[]>;
  share: ShareSettings;
  commitMessage: string;
  set: (patch: Partial<Omit<SessionState, "set" | "togglePref" | "setShare" | "selectRepos">>) => void;
  selectRepos: (login: string, ids: string[]) => void;
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
      selectedRepos: {},
      share: DEFAULT_SHARE,
      commitMessage: "Update slides",
      set: (patch) => set(patch),
      togglePref: (key, fallback) => set((s) => ({ prefs: { ...s.prefs, [key]: !(s.prefs[key] ?? fallback) } })),
      setShare: (patch) => set((s) => ({ share: { ...s.share, ...patch } })),
      selectRepos: (login, ids) => set((s) => ({ selectedRepos: { ...s.selectedRepos, [login]: ids } })),
    }),
    {
      name: "md2slides-prefs",
      version: 1,
      partialize: (s) => ({ prefs: s.prefs, share: s.share, selectedRepos: s.selectedRepos }),
      // v0 stored settings for the old mock share dialog.
      migrate: (state, version) => ({ ...(state as object), ...(version < 1 ? { share: DEFAULT_SHARE } : {}) }) as SessionState,
    },
  ),
);

export const pref = (prefs: Record<string, boolean>, key: string, fallback: boolean) => prefs[key] ?? fallback;
