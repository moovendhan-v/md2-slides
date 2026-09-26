import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type AiProviderName = "cloudflare" | "gemini";

export interface ByokKeys {
  provider: AiProviderName;
  gemini: { apiKey: string; model: string };
  cloudflare: { accountId: string; apiToken: string; model: string };
}

interface ByokState extends ByokKeys {
  enabled: boolean;
  set: (patch: Partial<Omit<ByokState, "set" | "clear">>) => void;
  setGemini: (patch: Partial<ByokKeys["gemini"]>) => void;
  setCloudflare: (patch: Partial<ByokKeys["cloudflare"]>) => void;
  clear: () => void;
}

const EMPTY: ByokKeys & { enabled: boolean } = {
  enabled: false,
  provider: "gemini",
  gemini: { apiKey: "", model: "" },
  cloudflare: { accountId: "", apiToken: "", model: "" },
};

/**
 * Bring-your-own AI keys. Persisted to `sessionStorage` only — they vanish
 * when the tab closes, are sent with each generation request, and the server
 * never stores or logs them.
 */
export const useByok = create<ByokState>()(
  persist(
    (set) => ({
      ...EMPTY,
      set: (patch) => set(patch),
      setGemini: (patch) => set((s) => ({ gemini: { ...s.gemini, ...patch } })),
      setCloudflare: (patch) => set((s) => ({ cloudflare: { ...s.cloudflare, ...patch } })),
      clear: () => set(EMPTY),
    }),
    { name: "slidewise-byok", storage: createJSONStorage(() => sessionStorage) },
  ),
);

/** Request payload for the keys the user actually filled in (undefined when BYOK is off). */
export function byokPayload(s: ByokKeys & { enabled: boolean }) {
  if (!s.enabled) return undefined;
  const gemini = s.gemini.apiKey ? { apiKey: s.gemini.apiKey, model: s.gemini.model || undefined } : undefined;
  const cloudflare = s.cloudflare.accountId && s.cloudflare.apiToken ? { ...s.cloudflare, model: s.cloudflare.model || undefined } : undefined;
  return gemini || cloudflare ? { gemini, cloudflare } : undefined;
}
