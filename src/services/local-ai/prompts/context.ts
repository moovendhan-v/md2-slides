import type { Deck, Slide, Block } from "@/engine/types";

/**
 * Extracts compact slide context for targeted local SLM operations.
 */
export function getSlideContext(slide: Slide): string {
  const parts: string[] = [];
  if (slide.kicker) parts.push(`[${slide.kicker}]`);
  if (slide.title) parts.push(`# ${slide.title}`);
  if (slide.body?.trim()) parts.push(slide.body.trim());
  if (slide.notes?.trim()) parts.push(`???\n${slide.notes.trim()}`);
  return parts.join("\n\n");
}

/**
 * Summarizes the full deck outline into a concise summary suitable for feeding into an SLM.
 */
export function getDeckOutline(deck: Deck): string {
  const title = deck.meta?.title ? `Deck: ${deck.meta.title}\n` : "";
  const slideList = deck.slides.map((s, idx) => {
    const kicker = s.kicker ? `[${s.kicker}] ` : "";
    const slideTitle = s.title || `Slide ${idx + 1}`;
    return `${idx + 1}. ${kicker}${slideTitle}`;
  });
  return `${title}Slides (${deck.slides.length}):\n${slideList.join("\n")}`;
}

/**
 * Extracts relevant block representations from a slide.
 */
export function getRelevantBlocks(slide: Slide): Block[] {
  const blocks: Block[] = [];
  if (slide.groups) {
    for (const group of slide.groups) {
      for (const b of group) {
        blocks.push(b);
      }
    }
  }
  return blocks;
}
