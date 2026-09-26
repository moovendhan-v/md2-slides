import "server-only";
import { ProviderError, type AiProvider, type GeminiCreds } from "./types";

interface GeminiResponse {
  error?: { message: string };
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
}

/** Google Gemini `generateContent` (API key sent as a header, never in the URL). */
export function geminiProvider(c: GeminiCreds): AiProvider {
  return {
    name: "gemini",
    async generate(p, signal) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(c.model)}:generateContent`;
      const res = await fetch(url, {
        method: "POST",
        signal,
        headers: { "x-goog-api-key": c.apiKey, "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: p.system }] },
          contents: [{ role: "user", parts: [{ text: p.user }] }],
          generationConfig: { maxOutputTokens: p.maxTokens, temperature: 0.7 },
        }),
      });
      const j = (await res.json().catch(() => ({}))) as GeminiResponse;
      if (!res.ok) throw new ProviderError("gemini", res.status, j.error?.message || res.statusText || "Gemini error");
      if (j.promptFeedback?.blockReason) throw new ProviderError("gemini", 0, `Blocked: ${j.promptFeedback.blockReason}`);
      const text = (j.candidates?.[0]?.content?.parts ?? []).map((x) => x.text ?? "").join("");
      if (!text.trim()) throw new ProviderError("gemini", 0, `Gemini returned no text (${j.candidates?.[0]?.finishReason ?? "unknown"})`);
      return text;
    },
  };
}
