import { describe, expect, it, vi } from "vitest";
import { generateWithFailover, providerChain } from "@/server/ai/router";
import { ProviderError, type AiProvider } from "@/server/ai/types";

vi.mock("@/server/notify", () => ({ notify: vi.fn() }));

const prompt = { system: "s", user: "u", maxTokens: 10 };
const ok = (name: "cloudflare" | "gemini", text = "# Deck"): AiProvider => ({ name, generate: async () => text });
const failing = (name: "cloudflare" | "gemini", status: number): AiProvider => ({
  name,
  generate: async () => {
    throw new ProviderError(name, status, "boom");
  },
});

describe("providerChain", () => {
  const cf = { accountId: "a", apiToken: "t", model: "m" };
  const gm = { apiKey: "k", model: "g" };
  it("orders primary first and skips providers without credentials", () => {
    expect(providerChain("gemini", { cloudflare: cf, gemini: gm }).map((p) => p.name)).toEqual(["gemini", "cloudflare"]);
    expect(providerChain("cloudflare", { cloudflare: cf, gemini: gm }).map((p) => p.name)).toEqual(["cloudflare", "gemini"]);
    expect(providerChain("cloudflare", { cloudflare: { ...cf, apiToken: "" }, gemini: gm }).map((p) => p.name)).toEqual(["gemini"]);
  });
});

describe("generateWithFailover", () => {
  it("falls back on rate limit", async () => {
    const r = await generateWithFailover([failing("cloudflare", 429), ok("gemini")], prompt, { timeoutMs: 1000, byok: false });
    expect(r.provider).toBe("gemini");
    expect(r.attempts.map((a) => [a.provider, a.ok, a.status])).toEqual([["cloudflare", false, 429], ["gemini", true, undefined]]);
  });

  it("falls back when output fails validation", async () => {
    const r = await generateWithFailover([ok("cloudflare", "junk"), ok("gemini", "# Good")], prompt, { timeoutMs: 1000, byok: false, validate: (t) => (t.startsWith("#") ? null : "no slides") });
    expect(r.provider).toBe("gemini");
  });

  it("reports failure when every provider fails", async () => {
    const r = await generateWithFailover([failing("cloudflare", 500), failing("gemini", 429)], prompt, { timeoutMs: 1000, byok: true });
    expect(r.text).toBeNull();
    expect(r.attempts).toHaveLength(2);
  });
});
