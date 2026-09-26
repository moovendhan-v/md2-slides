export interface DeckDraft {
  markdown: string;
  /** Provider label and model that wrote it (from the server config). */
  provider: string;
  model: string;
}

export interface GenerateOptions {
  slides: number;
  signal?: AbortSignal;
}

/** Server AI endpoint status from the ping check. */
export interface AiHealth {
  configured: boolean;
  ok: boolean;
  provider?: string;
  model?: string;
  latencyMs?: number;
  method?: "models" | "chat";
  modelListed?: boolean;
  status?: number;
  error?: string;
}

export interface AiDeckService {
  generate(prompt: string, opts: GenerateOptions): Promise<DeckDraft>;
  health(): Promise<AiHealth>;
}
