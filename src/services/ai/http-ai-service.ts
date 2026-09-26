import type { AiDeckService, DeckDraft, GenerateOptions, ProviderAttempt } from "./types";

/** AI failure with the providers that were tried (for a useful error message). */
export class AiError extends Error {
  constructor(message: string, public status: number, public attempts: ProviderAttempt[] = []) {
    super(message);
  }
}

/** Calls `/api/ai`, which fails over between Cloudflare Workers AI and Gemini. */
export class HttpAiDeckService implements AiDeckService {
  async generate(prompt: string, { slides, provider, byok, signal }: GenerateOptions): Promise<DeckDraft> {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt, slides, provider, byok }),
      signal,
      cache: "no-store",
    });
    const j = (await res.json().catch(() => ({}))) as Partial<DeckDraft> & { error?: string; attempts?: ProviderAttempt[] };
    if (!res.ok || !j.markdown || !j.provider) throw new AiError(j.error || `AI request failed (${res.status})`, res.status, j.attempts);
    return { markdown: j.markdown, provider: j.provider, attempts: j.attempts ?? [] };
  }
}
