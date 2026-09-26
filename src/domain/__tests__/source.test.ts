import { describe, expect, it } from "vitest";
import type { Block, Deck, Slide } from "@/engine/types";
import { setVariant, removeBlock, setImageArg } from "@/domain/source/blocks";
import { setDirective, setLayout } from "@/domain/source/directives";
import { writeMeta } from "@/domain/source/frontmatter";
import { deleteSlide, duplicateSlide, formatSource, lineDiff } from "@/domain/source/slides";
import { transformBlock } from "@/domain/source/transform";
import { buildTree, isMarkdown } from "@/domain/workspace/tree";

const slide = (startLine: number, dir: Record<string, string> = {}): Slide => ({ startLine, title: "", titleLine: -1, kicker: "", body: "", groups: [[]], notes: "", layout: "", dir });

describe("front-matter", () => {
  it("updates, inserts and creates keys", () => {
    expect(writeMeta("---\ntheme: zinc\n---\n# A", "theme", "slate")).toBe("---\ntheme: slate\n---\n# A");
    expect(writeMeta("---\ntheme: zinc\n---\n# A", "glass", "true")).toBe("---\ntheme: zinc\nglass: true\n---\n# A");
    expect(writeMeta("# A", "mode", "light")).toBe("---\nmode: light\n---\n# A");
  });
});

describe("directives", () => {
  it("adds, merges and clears slide directives", () => {
    const one = setDirective("# A", slide(0), "bg", "#111");
    expect(one).toBe("<!-- bg: #111 -->\n# A");
    const two = setDirective(one, slide(0), "accent", "#f00");
    expect(two).toBe("<!-- bg: #111; accent: #f00 -->\n# A");
    expect(setDirective(setDirective(two, slide(0), "bg", null), slide(0), "accent", null)).toBe("# A");
  });

  it("keeps layout lines separate", () => {
    expect(setLayout("# A", slide(0, { image: "x.png" }), "image-left")).toBe("<!-- layout: image-left; image: x.png -->\n# A");
  });
});

describe("blocks", () => {
  const cards: Block = { type: "cards", line: 1, args: { style: "grid" }, rows: ["- a | T | x"] };
  const src = "# A\n:::cards style=grid\n- a | T | x\n:::";

  it("restyles and removes fenced blocks", () => {
    expect(setVariant(src, cards, "glass")).toContain(":::cards style=glass");
    expect(removeBlock(src, cards)).toBe("# A");
  });

  it("transforms cards into a table", () => {
    expect(transformBlock(src, cards, "table")).toBe("# A\n| Item | Detail |\n|---|---|\n| T | x |");
  });

  it("edits image attributes", () => {
    expect(setImageArg("![a](b.png)", 0, "w", "60")).toBe("![a](b.png){w=60}");
    expect(setImageArg("![a](b.png){w=60}", 0, "w", "")).toBe("![a](b.png)");
  });
});

describe("slides", () => {
  const src = "# One\n---\n# Two";
  const deck: Deck = { meta: {}, problems: [], slides: [slide(0), slide(2)] };

  it("duplicates and deletes slides", () => {
    expect(duplicateSlide(src, deck, 1)).toBe("# One\n---\n# Two\n---\n# Two");
    expect(deleteSlide(src, deck, 1)).toBe("# One");
  });

  it("formats and diffs", () => {
    expect(formatSource("a  \n\n\n\nb")).toBe("a\n\nb\n");
    expect(lineDiff("a\nb", "a\nc\nd")).toEqual({ add: 2, del: 1 });
  });
});

describe("tree", () => {
  it("sorts folders before files", () => {
    const t = buildTree(["z.md", "decks/b.md", "decks/a.md"]);
    expect(t.map((n) => n.name)).toEqual(["decks", "z.md"]);
  });
});

describe("markdown-only tree", () => {
  it("drops non-Markdown files and empty folders", () => {
    const paths = ["README.md", "src/index.ts", "crates/lib.rs", "docs/talks/intro.md", "public/logo.svg"].filter(isMarkdown);
    const t = buildTree(paths);
    expect(t.map((n) => n.name)).toEqual(["docs", "README.md"]);
  });
});
