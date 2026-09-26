import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getServerEngine } from "@/engine/server";
import { env } from "@/server/env";
import { chatCompletion } from "@/server/ai/openai-compatible";
import { AiRequestError } from "@/server/ai/types";
import { notify } from "@/server/notify";
import { clientIp, rateLimit } from "@/server/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 120;

interface Body {
  prompt?: string;
  slides?: number;
}

/** Output that does not parse into slides is retried once; other failures are returned as-is. */
const ATTEMPTS = 2;

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

/**
 * POST { prompt, slides } → { markdown, problems, provider, model }.
 * Uses the single OpenAI-compatible endpoint from AI_BASE_URL / AI_API_KEY / AI_MODEL.
 */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as Body | null;
  const prompt = b?.prompt?.trim();
  if (!b || !prompt) return fail("prompt is required", 400);
  if (prompt.length > 4000) return fail("prompt is too long (max 4000 characters)", 400);
  const ai = env.ai();
  if (!ai) return fail("AI is not configured on the server (set AI_BASE_URL, AI_API_KEY and AI_MODEL)", 503);
  const wait = rateLimit(`ai:${clientIp(req)}`, 10, 60_000);
  if (wait) return fail(`Too many generations — try again in ${wait}s`, 429, { retryAfter: wait });

  const engine = getServerEngine();
  const slides = Math.min(20, Math.max(2, Number(b.slides) || 6));
  const chat = {
    system: `You write slide decks in md2slides Markdown. Follow this specification exactly:\n\n${await loadSpec()}`,
    user: `Write a deck of about ${slides} slides for this request:\n${prompt}\n\nReturn ONLY the Markdown file, starting with the front-matter --- line. No explanations, no code fences.`,
    maxTokens: 3000,
  };
  let lastError: AiRequestError | null = null;
  for (let i = 0; i < ATTEMPTS; i++) {
    try {
      const markdown = extractDeck(await chatCompletion(ai, chat, AbortSignal.timeout(60_000)));
      const parsed = engine.parse(markdown);
      if (parsed.slides.length) return NextResponse.json({ markdown, problems: parsed.problems, provider: ai.label, model: ai.model }, { headers: noStore });
      lastError = new AiRequestError(0, "The model's output contained no slides");
    } catch (e) {
      lastError = e instanceof AiRequestError ? e : new AiRequestError(0, (e as Error).message);
      break;
    }
  }
  const err = lastError!;
  notify("error", "AI generation failed", { provider: ai.label, model: ai.model, status: String(err.status), error: err.message });
  if (err.rateLimited) return fail(`${ai.label} is rate limiting requests — try again shortly`, 429);
  return fail(`AI generation failed: ${err.message}`, 502);
}
