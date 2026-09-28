export interface GenerateSlidePromptOptions {
  topic: string;
  context?: string;
  count?: number;
}

export function buildGenerateSlidePrompt(opts: GenerateSlidePromptOptions): { system?: string; prompt: string } {
  const count = opts.count ?? 1;
  const countInstruction = count === 1 ? "a single slide" : `a sequence of ${count} slides`;

  let prompt = `Create ${countInstruction} about the following topic:
Topic: ${opts.topic.trim()}
`;

  if (opts.context) {
    prompt += `
Existing presentation context:
${opts.context.trim()}
`;
  }

  prompt += `
Requirements:
- Start directly with the slide content.
- Use an engaging title, a kicker like [${opts.topic.slice(0, 15)}], and 3-4 crisp bullet points or cards.
- Add speaker notes at the bottom starting with '???'.
- Return ONLY the slide Markdown.`;

  return { prompt };
}
