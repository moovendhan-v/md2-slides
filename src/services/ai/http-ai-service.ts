import { AI_PRESETS } from "@/data";
import type { AiDeckService, DeckDraft } from "./types";

/** Closest ready-made deck for a prompt (keyword overlap). */
export function closestPreset(prompt: string) {
  const words = prompt.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
  return AI_PRESETS.find((p) => words.some((w) => p.prompt.toLowerCase().includes(w))) ?? AI_PRESETS[0];
}

/** Calls `/api/ai`; falls back to the nearest example deck when AI is unavailable. */
export class HttpAiDeckService implements AiDeckService {
  async generate(prompt: string, slides: number, signal?: AbortSignal): Promise<DeckDraft> {
    try {
      const res = await fetch("/api/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt, slides }), signal });
      if (res.ok) {
        const { markdown } = (await res.json()) as { markdown: string };
        return { markdown, source: "ai" };
      }
      const reason = res.status === 503 ? "AI service unavailable" : (await res.text()) || "AI request failed";
      return { markdown: closestPreset(prompt).md, source: "example", note: `${reason} — used the closest ready-made deck.` };
    } catch (e) {
      if ((e as Error).name === "AbortError") throw e;
      return { markdown: closestPreset(prompt).md, source: "example", note: "AI service unreachable — used the closest ready-made deck." };
    }
  }
}
