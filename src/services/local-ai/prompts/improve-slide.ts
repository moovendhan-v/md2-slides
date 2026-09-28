export interface ImproveSlideOptions {
  slideContent: string;
  instruction?: string;
  mode?: "concise" | "impactful" | "professional" | "visual" | "custom";
}

export function buildImproveSlidePrompt(opts: ImproveSlideOptions): { prompt: string } {
  const modeInstruction = (() => {
    switch (opts.mode) {
      case "concise":
        return "Make this slide more concise. Cut unnecessary words and maximize impact.";
      case "impactful":
        return "Make this slide highly engaging and memorable with strong phrasing and contrast.";
      case "professional":
        return "Refine this slide with executive-ready, polished professional language.";
      case "visual":
        return "Structure this slide using cards (::: card) or callouts (> [!tip]) to make it visual.";
      case "custom":
      default:
        return opts.instruction ? opts.instruction.trim() : "Improve and polish this slide.";
    }
  })();

  const prompt = `Task: ${modeInstruction}

Current Slide Markdown:
${opts.slideContent.trim()}

Instructions:
- Keep the core message but enhance formatting, clarity, and readability.
- Return ONLY the updated slide Markdown. Do not add commentary.`;

  return { prompt };
}
