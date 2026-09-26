import "server-only";

const hits = new Map<string, number[]>();

/** Sliding-window limiter per key (per server instance). Returns seconds to wait, or 0 if allowed. */
export function rateLimit(key: string, limit: number, windowMs: number): number {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) return Math.ceil((windowMs - (now - recent[0])) / 1000);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.delete(hits.keys().next().value!);
  return 0;
}

export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
