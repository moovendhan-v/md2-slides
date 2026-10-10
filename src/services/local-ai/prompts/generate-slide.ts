export interface GenerateSlidePromptOptions {
  topic: string;
  context?: string;
  count?: number;
}

export function buildGenerateSlidePrompt(opts: GenerateSlidePromptOptions): { system?: string; prompt: string } {
  const topic = opts.topic.trim();

  let prompt = `Create a single informative presentation slide about "${topic}".
Include a category kicker, title, 3-4 bullet points with bold keywords, and speaker notes starting with '???'.`;

  if (opts.context) {
    prompt += `\n\nExisting presentation context:\n${opts.context.trim()}`;
  }

  return { prompt };
}
