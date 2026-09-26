import "server-only";
import { notify } from "@/server/notify";
import { cloudflareProvider } from "./cloudflare";
import { geminiProvider } from "./gemini";
import { ProviderError, type AiProvider, type ChatPrompt, type CloudflareCreds, type GeminiCreds, type ProviderName } from "./types";

export interface ProviderCreds {
  cloudflare?: CloudflareCreds;
  gemini?: GeminiCreds;
}

export interface Attempt {
  provider: ProviderName;
  ok: boolean;
  status?: number;
  error?: string;
}

const usable = {
  cloudflare: (c?: CloudflareCreds) => !!(c?.accountId && c.apiToken && c.model),
  gemini: (c?: GeminiCreds) => !!(c?.apiKey && c.model),
};

/** Providers in priority order: `primary` first, the other as fallback; skips ones without credentials. */
export function providerChain(primary: ProviderName, creds: ProviderCreds): AiProvider[] {
  const order: ProviderName[] = primary === "gemini" ? ["gemini", "cloudflare"] : ["cloudflare", "gemini"];
  return order.flatMap((n): AiProvider[] => {
    if (n === "cloudflare" && usable.cloudflare(creds.cloudflare)) return [cloudflareProvider(creds.cloudflare!)];
    if (n === "gemini" && usable.gemini(creds.gemini)) return [geminiProvider(creds.gemini!)];
    return [];
  });
}

/**
 * Try each provider in turn. Any failure — rate limit (429), server error,
 * timeout, empty or invalid output — moves on to the next provider.
 */
export async function generateWithFailover(
  chain: AiProvider[],
  prompt: ChatPrompt,
  opts: { timeoutMs: number; byok: boolean; validate?: (text: string) => string | null },
) {
  const attempts: Attempt[] = [];
  for (const p of chain) {
    try {
      const text = await p.generate(prompt, AbortSignal.timeout(opts.timeoutMs));
      const invalid = opts.validate?.(text);
      if (invalid) throw new ProviderError(p.name, 0, invalid);
      attempts.push({ provider: p.name, ok: true });
      if (attempts.length > 1) notify("warn", "AI provider fallback", { from: attempts[0].provider, to: p.name, reason: attempts[0].error ?? "", byok: String(opts.byok) });
      return { text, provider: p.name, attempts };
    } catch (e) {
      const err = e instanceof ProviderError ? e : new ProviderError(p.name, 0, (e as Error).name === "TimeoutError" ? "Timed out" : (e as Error).message);
      attempts.push({ provider: p.name, ok: false, status: err.status, error: err.message });
    }
  }
  notify("error", "AI generation failed on all providers", Object.fromEntries(attempts.map((a) => [a.provider, `${a.status ?? ""} ${a.error ?? ""}`.trim()])));
  return { text: null, provider: null, attempts };
}
