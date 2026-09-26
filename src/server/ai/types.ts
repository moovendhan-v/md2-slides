import "server-only";

export type ProviderName = "cloudflare" | "gemini";

export interface ChatPrompt {
  system: string;
  user: string;
  maxTokens: number;
}

/** One text-generation backend. */
export interface AiProvider {
  name: ProviderName;
  generate(p: ChatPrompt, signal: AbortSignal): Promise<string>;
}

/** Provider failure with the upstream HTTP status (0 = network / empty output). */
export class ProviderError extends Error {
  constructor(public provider: ProviderName, public status: number, message: string) {
    super(message);
  }
  get rateLimited() {
    return this.status === 429;
  }
}

export interface CloudflareCreds {
  accountId: string;
  apiToken: string;
  model: string;
}

export interface GeminiCreds {
  apiKey: string;
  model: string;
}
