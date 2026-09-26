import type { AiProviderName, ByokKeys } from "@/stores/byok";

export interface ProviderAttempt {
  provider: AiProviderName;
  ok: boolean;
  status?: number;
  error?: string;
}

export interface DeckDraft {
  markdown: string;
  provider: AiProviderName;
  attempts: ProviderAttempt[];
}

export interface GenerateOptions {
  slides: number;
  provider?: AiProviderName;
  byok?: { gemini?: Partial<ByokKeys["gemini"]>; cloudflare?: Partial<ByokKeys["cloudflare"]> };
  signal?: AbortSignal;
}

export interface AiDeckService {
  generate(prompt: string, opts: GenerateOptions): Promise<DeckDraft>;
}
