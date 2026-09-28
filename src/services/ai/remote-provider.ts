import type { AiDeckService, AiHealth, DeckDraft, GenerateOptions } from "./types";

export class AiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** Calls `/api/ai` (generation) and `/api/ai/health` (ping), backed by the server's AI endpoint. */
export class RemoteAiProvider implements AiDeckService {
  async generate(prompt: string, opts?: GenerateOptions): Promise<DeckDraft> {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt, slides: opts?.slides ?? 6 }),
      signal: opts?.signal,
      cache: "no-store",
    });
    const j = (await res.json().catch(() => ({}))) as Partial<DeckDraft> & { error?: string };
    if (!res.ok || !j.markdown) {
      throw new AiError(j.error || `AI request failed (${res.status})`, res.status);
    }
    return { markdown: j.markdown, provider: j.provider ?? "Remote AI", model: j.model ?? "" };
  }

  async health(): Promise<AiHealth> {
    const res = await fetch("/api/ai/health", { cache: "no-store" });
    const j = (await res.json().catch(() => ({}))) as Partial<AiHealth>;
    if (!res.ok) {
      return { configured: true, ok: false, error: j.error || `Health check failed (${res.status})` };
    }
    return { configured: false, ok: false, ...j };
  }
}
