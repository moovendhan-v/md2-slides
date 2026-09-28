export interface GenerateDeckPromptOptions {
  topic: string;
  slideCount?: number;
  audience?: string;
}

export function buildGenerateDeckPrompt(opts: GenerateDeckPromptOptions): { prompt: string } {
  const count = Math.min(12, Math.max(2, opts.slideCount ?? 5));
  const audience = opts.audience ? ` for ${opts.audience}` : "";

  const prompt = `Create a complete ${count}-slide presentation deck about "${opts.topic.trim()}"${audience}.

Format requirements:
1. Begin with front-matter:
---
theme: dark
---
2. Separate all slides using:
---
3. Slide 1 must be a Title slide with:
[Overview]
# Presentation Title
## Subtitle or hook
4. Subsequent slides should cover key concepts, architecture/steps, details, and conclusion.
5. Use kickers like [Concept], [Architecture], [Benefits], [Summary].
6. Use bullet lists and cards where appropriate.
7. Include speaker notes starting with '???' on each slide.
8. Output ONLY the raw Markdown file.`;

  return { prompt };
}
