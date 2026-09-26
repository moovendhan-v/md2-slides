export interface DeckDraft {
  markdown: string;
  /** "ai" when a model wrote it, "example" for the offline fallback. */
  source: "ai" | "example";
  note?: string;
}

export interface AiDeckService {
  generate(prompt: string, slides: number, signal?: AbortSignal): Promise<DeckDraft>;
}
