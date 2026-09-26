import "server-only";
import { env } from "./env";

type Level = "info" | "warn" | "error";
const COLORS: Record<Level, number> = { info: 0x60a5fa, warn: 0xfbbf24, error: 0xf87171 };

/**
 * Fire-and-forget Discord alert. Never include secrets, tokens, API keys or
 * user prompt text in `fields` — only provider names, statuses and counts.
 */
export function notify(level: Level, title: string, fields: Record<string, string | number> = {}) {
  const url = env.discordWebhook();
  if (!url) return;
  const body = {
    username: "md2slides",
    embeds: [
      {
        title,
        color: COLORS[level],
        timestamp: new Date().toISOString(),
        fields: Object.entries(fields).map(([name, value]) => ({ name, value: String(value).slice(0, 1000), inline: true })),
      },
    ],
  };
  void fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(4000) }).catch(() => undefined);
}
