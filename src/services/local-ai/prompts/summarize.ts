export interface SummarizeSlideOptions {
  slideContent: string;
  bulletCount?: number;
}

export function buildSummarizePrompt(opts: SummarizeSlideOptions): { prompt: string } {
  const count = opts.bulletCount ?? 3;
  const prompt = `Summarize the following slide content into exactly ${count} clear and punchy bullet points.

Slide Markdown:
${opts.slideContent.trim()}

Instructions:
- Distill the most critical insights.
- Return ONLY the bullet points formatted with markdown '-' (e.g. - **Key Topic**: description).`;

  return { prompt };
}
