import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getServerEngine } from "@/engine/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const MODEL = process.env.SLIDEWISE_AI_MODEL || "claude-opus-5";

let spec: string | null = null;
const loadSpec = async () => (spec ??= await fs.readFile(path.join(process.cwd(), "public", "llms-full.txt"), "utf8"));

const stripFence = (s: string) => s.replace(/^```(markdown|md)?\s*\n/, "").replace(/\n```\s*$/, "").trim() + "\n";

/**
 * POST { prompt, slides } → { markdown, problems }. Uses the Slidewise syntax
 * spec (llms-full.txt) as the system prompt, then validates the draft with the
 * Wasm parser. Returns 503 when no Anthropic credentials are configured so the
 * client can fall back to ready-made examples.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { prompt?: string; slides?: number } | null;
  const prompt = body?.prompt?.trim();
  if (!prompt) return new NextResponse("prompt is required", { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) return new NextResponse("AI is not configured", { status: 503 });

  const client = new Anthropic();
  try {
    const res = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: `You write slide decks in Slidewise Markdown. Follow this specification exactly:\n\n${await loadSpec()}`,
      messages: [
        {
          role: "user",
          content: `Write a deck of about ${body?.slides ?? 6} slides for this request:\n${prompt}\n\nReturn ONLY the Markdown file, starting with the front-matter --- line.`,
        },
      ],
    });
    if (res.stop_reason === "refusal") return new NextResponse("The request was declined", { status: 422 });
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const markdown = stripFence(text);
    const { problems } = getServerEngine().parse(markdown);
    return NextResponse.json({ markdown, problems, model: res.model });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return new NextResponse("Rate limited — try again shortly", { status: 429 });
    if (e instanceof Anthropic.AuthenticationError) return new NextResponse("AI credentials are invalid", { status: 503 });
    if (e instanceof Anthropic.APIError) return new NextResponse(e.message, { status: 502 });
    throw e;
  }
}
