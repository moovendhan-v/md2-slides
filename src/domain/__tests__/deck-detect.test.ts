import { describe, expect, it } from "vitest";
import { looksLikeDeck } from "../../../vscode-extension/src/deck-detect";

describe("VS Code deck detection", () => {
  it("recognises decks", () => {
    expect(looksLikeDeck("---\ntitle: x\n---\n# A")).toBe(true);
    expect(looksLikeDeck("# A\n\n---\n\n# B")).toBe(true);
    expect(looksLikeDeck("# A\n:::cards\n- a\n:::")).toBe(true);
  });
  it("ignores plain docs, setext headings and code", () => {
    expect(looksLikeDeck("# Readme\nSome text")).toBe(false);
    expect(looksLikeDeck("Title\n---\ntext")).toBe(false);
    expect(looksLikeDeck("```yaml\n\n---\n```")).toBe(false);
  });
});
