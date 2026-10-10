export interface GenerateDeckPromptOptions {
  topic: string;
  slideCount?: number;
  audience?: string;
}

export function buildGenerateDeckPrompt(opts: GenerateDeckPromptOptions): { prompt: string } {
  const count = Math.min(10, Math.max(2, opts.slideCount ?? 5));
  const topic = opts.topic.trim();
  const audience = opts.audience ? ` for ${opts.audience}` : "";

  const prompt = `Create a ${count}-slide presentation deck about "${topic}"${audience}.
Include informative slide titles, crisp bullet points with bold keywords, and speaker notes for each slide.`;

  return { prompt };
}
