import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getServerEngine } from "@/engine/server";
import { env } from "@/server/env";
import { generateWithFailover, providerChain, type ProviderCreds } from "@/server/ai/router";
import type { ProviderName } from "@/server/ai/types";
import { clientIp, rateLimit } from "@/server/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 120;

interface Body {
  prompt?: string;
  slides?: number;
  /** Preferred provider (defaults to AI_PROVIDER). */
  provider?: ProviderName;
  /** Bring-your-own keys: used for this request only — never stored, logged or returned. */
  byok?: { cloudflare?: { accountId?: string; apiToken?: string; model?: string }; gemini?: { apiKey?: string; model?: string } };
}

let spec: string | null = null;
const loadSpec = async () => (spec ??= await fs.readFile(path.join(process.cwd(), "public", "llms-full.txt"), "utf8"));
const noStore = { "cache-control": "no-store" };
const fail = (msg: string, status: number, extra: Record<string, unknown> = {}) => NextResponse.json({ error: msg, ...extra }, { status, headers: noStore });

/** Strip chat chatter / code fences so only the deck Markdown remains. */
function extractDeck(text: string) {
  let md = text.trim();
  const fence = md.match(/```(?:markdown|md)?\s*\n([\s\S]*?)\n```/);
  if (fence) md = fence[1];
  const fm = md.indexOf("---");
  if (fm > 0 && md.slice(0, fm).trim().split("\n").length <= 3) md = md.slice(fm);
  return md.trim() + "\n";
}

function resolveCreds(b: Body): { creds: ProviderCreds; byok: boolean } {
  const cf = b.byok?.cloudflare;
  const gm = b.byok?.gemini;
  const envCf = env.cloudflare();
  const envGm = env.gemini();
  const cfByok = !!(cf?.accountId && cf.apiToken);
  const gmByok = !!gm?.apiKey;
  return {
    byok: cfByok || gmByok,
    creds: {
      cloudflare: cfByok ? { accountId: cf!.accountId!, apiToken: cf!.apiToken!, model: cf!.model || envCf.model } : envCf,
      gemini: gmByok ? { apiKey: gm!.apiKey!, model: gm!.model || envGm.model } : envGm,
    },
  };
}

/**
 * POST { prompt, slides, provider?, byok? } → { markdown, problems, provider, attempts }.
 * Tries the primary provider, then fails over to the other on rate limits,
 * errors, timeouts or output that does not parse into slides.
 */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as Body | null;
  const prompt = b?.prompt?.trim();
  if (!b || !prompt) return fail("prompt is required", 400);
  if (prompt.length > 4000) return fail("prompt is too long (max 4000 characters)", 400);
  const { creds, byok } = resolveCreds(b);
  if (!byok) {
    const wait = rateLimit(`ai:${clientIp(req)}`, 10, 60_000);
    if (wait) return fail(`Too many generations — try again in ${wait}s, or add your own API key`, 429, { retryAfter: wait });
  }
  const primary: ProviderName = b.provider === "gemini" || b.provider === "cloudflare" ? b.provider : env.aiProvider();
  const chain = providerChain(primary, creds);
  if (!chain.length) return fail("AI is not configured — add an API key", 503);

  const engine = getServerEngine();
  const slides = Math.min(20, Math.max(2, Number(b.slides) || 6));
  const result = await generateWithFailover(
    chain,
    {
      system: `You write slide decks in Slidewise Markdown. Follow this specification exactly:\n\n${await loadSpec()}`,
      user: `Write a deck of about ${slides} slides for this request:\n${prompt}\n\nReturn ONLY the Markdown file, starting with the front-matter --- line. No explanations, no code fences.`,
      maxTokens: 3000,
    },
    { timeoutMs: 60_000, byok, validate: (t) => (engine.parse(extractDeck(t)).slides.length ? null : "Output contained no slides") },
  );
  if (!result.text) {
    const limited = result.attempts.some((a) => a.status === 429);
    return fail(limited ? "All AI providers are rate limited right now — try again shortly or use your own key" : "AI generation failed on every provider", limited ? 429 : 502, {
      attempts: result.attempts,
    });
  }
  const markdown = extractDeck(result.text);
  return NextResponse.json({ markdown, problems: engine.parse(markdown).problems, provider: result.provider, attempts: result.attempts }, { headers: noStore });
}
