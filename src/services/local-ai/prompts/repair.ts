import type { Problem } from "@/engine/types";

export interface RepairPromptOptions {
  invalidMarkdown: string;
  problems: Problem[];
}

export function buildRepairPrompt(opts: RepairPromptOptions): { prompt: string } {
  const errorList = opts.problems
    .filter((p) => p.sev === "error")
    .map((p) => `Line ${p.line}: ${p.msg}`)
    .join("\n");

  const prompt = `The following md2slides presentation markdown contains syntax errors:

Errors:
${errorList || "Markdown did not parse into valid slides."}

Invalid Markdown:
${opts.invalidMarkdown.trim()}

Instructions:
- Fix the syntax issues so it adheres strictly to valid md2slides Markdown.
- Keep the exact slide structure, separating slides with ---.
- Return ONLY the corrected Markdown.`;

  return { prompt };
}
