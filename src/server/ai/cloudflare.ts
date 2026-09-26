import "server-only";
import { ProviderError, type AiProvider, type CloudflareCreds } from "./types";

interface CfResponse {
  success?: boolean;
  errors?: { message: string }[];
  result?: { response?: string; choices?: { message?: { content?: string } }[] };
}

/** Cloudflare Workers AI (`/ai/run/{model}`); handles both classic and OpenAI-style result shapes. */
export function cloudflareProvider(c: CloudflareCreds): AiProvider {
  return {
    name: "cloudflare",
    async generate(p, signal) {
      const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(c.accountId)}/ai/run/${c.model}`;
      const res = await fetch(url, {
        method: "POST",
        signal,
        headers: { authorization: `Bearer ${c.apiToken}`, "content-type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "system", content: p.system }, { role: "user", content: p.user }], max_tokens: p.maxTokens }),
      });
      const j = (await res.json().catch(() => ({}))) as CfResponse;
      if (!res.ok || j.success === false) throw new ProviderError("cloudflare", res.status || 0, j.errors?.[0]?.message || res.statusText || "Cloudflare AI error");
      const text = j.result?.response ?? j.result?.choices?.[0]?.message?.content ?? "";
      if (!text.trim()) throw new ProviderError("cloudflare", 0, "Cloudflare AI returned no text");
      return text;
    },
  };
}
