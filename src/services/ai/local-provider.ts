import type { SlideEngine } from "@/engine/engine";
import type { AiDeckService, AiHealth, DeckDraft, GenerateOptions } from "./types";
import {
  getLocalAIProvider,
  type LocalAIProvider,
  MD2SLIDES_SYSTEM_PROMPT,
  buildGenerateDeckPrompt,
  buildGenerateSlidePrompt,
  buildImproveSlidePrompt,
  buildSpeakerNotesPrompt,
  buildSummarizePrompt,
  buildRepairPrompt,
} from "../local-ai";

/** Strip accidental code fences or markdown chat wrappers so raw md2slides Markdown remains. */
export function extractMarkdown(text: string): string {
  let md = text.trim();
  const fence = md.match(/```(?:markdown|md)?\s*\n([\s\S]*?)\n```/);
  if (fence) md = fence[1];
  const fm = md.indexOf("---");
  if (fm > 0 && md.slice(0, fm).trim().split("\n").length <= 3) {
    md = md.slice(fm);
  }
  return md.trim() + "\n";
}

export class LocalAiDeckService implements AiDeckService {
  private engine?: SlideEngine;
  private provider: LocalAIProvider;

  constructor(engine?: SlideEngine, provider?: LocalAIProvider) {
    this.engine = engine;
    this.provider = provider ?? getLocalAIProvider();
  }

  public setEngine(engine: SlideEngine) {
    this.engine = engine;
  }

  async generate(prompt: string, opts?: GenerateOptions): Promise<DeckDraft> {
    const status = this.provider.getStatus();
    if (status.state !== "ready" && status.state !== "generating") {
      throw new Error("Local AI model is not loaded. Please download/load the model in settings.");
    }

    let userPrompt: string;
    const systemPrompt = MD2SLIDES_SYSTEM_PROMPT;

    switch (opts?.task) {
      case "slide": {
        const p = buildGenerateSlidePrompt({
          topic: prompt,
          context: opts.context,
          count: opts.slides ?? 1,
        });
        userPrompt = p.prompt;
        break;
      }
      case "improve": {
        const p = buildImproveSlidePrompt({
          slideContent: opts.slideContent || prompt,
          instruction: opts.instruction || prompt,
        });
        userPrompt = p.prompt;
        break;
      }
      case "notes": {
        const p = buildSpeakerNotesPrompt({
          slideContent: opts.slideContent || prompt,
        });
        userPrompt = p.prompt;
        break;
      }
      case "summarize": {
        const p = buildSummarizePrompt({
          slideContent: opts.slideContent || prompt,
        });
        userPrompt = p.prompt;
        break;
      }
      case "deck":
      default: {
        const p = buildGenerateDeckPrompt({
          topic: prompt,
          slideCount: opts?.slides ?? 6,
        });
        userPrompt = p.prompt;
        break;
      }
    }

    let accumulated = "";
    let lastStats: { tokensPerSecond?: number; totalTokens?: number } | undefined;

    for await (const token of this.provider.generate({
      system: systemPrompt,
      prompt: userPrompt,
      signal: opts?.signal,
      temperature: 0.6,
      maxTokens: 2500,
    })) {
      accumulated = token.text;
      if (token.stats) lastStats = token.stats;
      if (opts?.onToken && token.delta) {
        opts.onToken(token.text, token.delta);
      }
    }

    let cleanMarkdown = extractMarkdown(accumulated);

    // Reuse existing Rust/WASM validator if available and perform repair if needed
    if (this.engine) {
      const parsed = this.engine.parse(cleanMarkdown);
      const errors = parsed.problems.filter((p) => p.sev === "error");

      if (errors.length > 0 && parsed.slides.length === 0) {
        // Attempt 1 repair iteration
        try {
          const repairPrompt = buildRepairPrompt({
            invalidMarkdown: cleanMarkdown,
            problems: parsed.problems,
          });

          let repairedAccumulated = "";
          for await (const token of this.provider.generate({
            system: systemPrompt,
            prompt: repairPrompt.prompt,
            signal: opts?.signal,
            temperature: 0.2,
            maxTokens: 2500,
          })) {
            repairedAccumulated = token.text;
          }

          const repairedClean = extractMarkdown(repairedAccumulated);
          const repairedParsed = this.engine.parse(repairedClean);
          if (repairedParsed.slides.length > 0) {
            cleanMarkdown = repairedClean;
          }
        } catch {
          // If repair failed or aborted, return original cleanMarkdown
        }
      }
    }

    return {
      markdown: cleanMarkdown,
      provider: "Local AI (Browser SLM)",
      model: status.modelId || "Local Model",
      stats: lastStats,
    };
  }

  async health(): Promise<AiHealth> {
    const supported = await this.provider.isSupported();
    const status = this.provider.getStatus();

    return {
      configured: true,
      ok: supported && (status.state === "ready" || status.isCached === true),
      provider: "Local AI",
      model: status.modelId || "Not loaded",
      method: "local",
      isLocal: true,
      backend: status.backend ?? "webgpu",
      error: !supported ? "WebGPU is not supported" : status.error,
    };
  }
}
