import "server-only";
import type { AiConfig } from "./ai/types";

/** Typed access to server-only environment variables. */
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name} (see .env.example)`);
  return v;
}

export const env = {
  githubClientId: () => required("GITHUB_CLIENT_ID"),
  githubClientSecret: () => required("GITHUB_CLIENT_SECRET"),
  sessionSecret: () => required("SESSION_SECRET"),
  /** The one AI endpoint (OpenAI-compatible). `null` when not configured. */
  ai: (): AiConfig | null => {
    const baseUrl = process.env.AI_BASE_URL ?? "";
    const apiKey = process.env.AI_API_KEY ?? "";
    const model = process.env.AI_MODEL ?? "";
    if (!baseUrl || !apiKey || !model) return null;
    let host = baseUrl;
    try {
      host = new URL(baseUrl).host;
    } catch {}
    return { baseUrl, apiKey, model, label: process.env.AI_PROVIDER_NAME || host };
  },
  discordWebhook: () => process.env.DISCORD_WEBHOOK_URL ?? "",
};
