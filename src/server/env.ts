import "server-only";

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
  aiProvider: () => (process.env.AI_PROVIDER === "gemini" ? "gemini" : "cloudflare") as "gemini" | "cloudflare",
  gemini: () => ({ apiKey: process.env.GEMINI_API_KEY ?? "", model: process.env.GEMINI_MODEL || "gemini-2.5-flash" }),
  cloudflare: () => ({
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? "",
    apiToken: process.env.CLOUDFLARE_API_TOKEN ?? "",
    model: process.env.CLOUDFLARE_AI_MODEL || "@cf/meta/llama-3.1-8b-instruct",
  }),
  discordWebhook: () => process.env.DISCORD_WEBHOOK_URL ?? "",
};
