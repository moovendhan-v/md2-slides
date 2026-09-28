export interface SpeakerNotesOptions {
  slideContent: string;
}

export function buildSpeakerNotesPrompt(opts: SpeakerNotesOptions): { prompt: string } {
  const prompt = `Generate comprehensive speaker talking points for this presentation slide.

Slide Markdown:
${opts.slideContent.trim()}

Instructions:
- Write 3-4 natural, conversational talking points that the presenter can speak aloud.
- Focus on explaining the context, nuances, and key takeaway of the slide.
- Return the output formatted with the '???' notes marker, for example:
???
- Point 1: Introduce the core concept...
- Point 2: Highlight the main takeaway...
- Point 3: Transition to the next topic...`;

  return { prompt };
}
