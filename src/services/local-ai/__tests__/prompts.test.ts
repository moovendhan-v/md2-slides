import { describe, it, expect } from "vitest";
import {
  MD2SLIDES_SYSTEM_PROMPT,
  buildGenerateDeckPrompt,
  buildGenerateSlidePrompt,
  buildImproveSlidePrompt,
  buildSpeakerNotesPrompt,
  buildSummarizePrompt,
  buildRepairPrompt,
  getSlideContext,
  getDeckOutline,
} from "../prompts";
import type { Deck, Slide } from "@/engine/types";

describe("Local AI Prompts", () => {
  it("includes md2slides syntax essentials in system prompt", () => {
    expect(MD2SLIDES_SYSTEM_PROMPT).toContain("---");
    expect(MD2SLIDES_SYSTEM_PROMPT).toContain("theme: dark");
    expect(MD2SLIDES_SYSTEM_PROMPT).toContain("???");
  });

  it("builds generate deck prompt correctly", () => {
    const prompt = buildGenerateDeckPrompt({ topic: "Kubernetes 101", slideCount: 5 });
    expect(prompt.prompt).toContain("Kubernetes 101");
    expect(prompt.prompt).toContain("5-slide presentation");
  });

  it("builds generate slide prompt correctly", () => {
    const prompt = buildGenerateSlidePrompt({ topic: "Rust Memory Safety" });
    expect(prompt.prompt).toContain("Rust Memory Safety");
    expect(prompt.prompt).toContain("Create a single informative presentation slide");
  });

  it("builds improve slide prompt with specific modes", () => {
    const concise = buildImproveSlidePrompt({
      slideContent: "# Big Title\n- long bullet point that needs shortening",
      mode: "concise",
    });
    expect(concise.prompt).toContain("concise");
    expect(concise.prompt).toContain("# Big Title");

    const visual = buildImproveSlidePrompt({
      slideContent: "# Architecture\n- Step 1\n- Step 2",
      mode: "visual",
    });
    expect(visual.prompt).toContain("cards");
  });

  it("builds speaker notes prompt correctly", () => {
    const prompt = buildSpeakerNotesPrompt({
      slideContent: "# Keynote\n- Main Point",
    });
    expect(prompt.prompt).toContain("speaker talking points");
    expect(prompt.prompt).toContain("???");
  });

  it("builds summarize prompt correctly", () => {
    const prompt = buildSummarizePrompt({
      slideContent: "# Complex Overview\nLots of text here...",
      bulletCount: 3,
    });
    expect(prompt.prompt).toContain("3 clear and punchy bullet points");
  });

  it("builds repair prompt with problem details", () => {
    const prompt = buildRepairPrompt({
      invalidMarkdown: "bad syntax",
      problems: [{ line: 2, sev: "error", msg: "Unclosed card block" }],
    });
    expect(prompt.prompt).toContain("Line 2: Unclosed card block");
  });

  it("extracts slide and deck contexts accurately", () => {
    const slide: Slide = {
      startLine: 1,
      title: "Slide Title",
      titleLine: 2,
      kicker: "Intro",
      body: "Body text with details",
      groups: [],
      notes: "Speaker notes here",
      layout: "default",
      dir: {},
    };

    const ctx = getSlideContext(slide);
    expect(ctx).toContain("[Intro]");
    expect(ctx).toContain("# Slide Title");
    expect(ctx).toContain("Body text with details");
    expect(ctx).toContain("???\nSpeaker notes here");

    const deck: Deck = {
      meta: { title: "My Master Deck" },
      slides: [slide],
      problems: [],
    };

    const outline = getDeckOutline(deck);
    expect(outline).toContain("Deck: My Master Deck");
    expect(outline).toContain("1. [Intro] Slide Title");
  });
});
