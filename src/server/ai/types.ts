import "server-only";

/** One OpenAI-compatible endpoint (OpenAI, Gemini, Cloudflare Workers AI, Groq, OpenRouter, Ollama…). */
export interface AiConfig {
  /** e.g. `https://api.openai.com/v1` — `/chat/completions` and `/models` are appended. */
  baseUrl: string;
  apiKey: string;
  model: string;
  /** Display name; defaults to the base URL's host. */
  label: string;
}

export interface ChatPrompt {
  system: string;
  user: string;
  maxTokens: number;
}

/** Upstream failure with its HTTP status (0 = network error, timeout or empty output). */
export class AiRequestError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
  get rateLimited() {
    return this.status === 429;
  }
}

/** Result of checking that the configured API answers with this key and model. */
export interface PingResult {
  ok: boolean;
  /** How the check was made: listing models, or a 1-token completion when `/models` is unsupported. */
  method: "models" | "chat";
  latencyMs: number;
  status?: number;
  error?: string;
  /** Whether the configured model appears in `/models` (undefined when not listed). */
  modelListed?: boolean;
  models?: number;
}
