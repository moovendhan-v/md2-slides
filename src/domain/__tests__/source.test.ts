import { describe, expect, it } from "vitest";
import type { Block, Deck, Slide } from "@/engine/types";
import { hasRowIcons, insertAtOffset, setVariant, removeBlock, setImageArg, setRowIcon } from "@/domain/source/blocks";
import { searchIcons } from "@/domain/icons/search";
import { searchSnippets } from "@/domain/deck/snippet-search";
import { setDirective, setLayout } from "@/domain/source/directives";
import { writeMeta } from "@/domain/source/frontmatter";
import { diffText } from "@/domain/source/diff";
import { deleteSlide, duplicateSlide, formatSource } from "@/domain/source/slides";
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
    const d = diffText("a\nb", "a\nc\nd");
    expect([d.add, d.del]).toEqual([2, 1]);
    expect(d.hunks[0].header).toBe("@@ -1,2 +1,3 @@");
    expect(d.hunks[0].lines.map((l) => l.op + l.text)).toEqual(["ctxa", "delb", "addc", "addd"]);
    const L = Array.from({ length: 20 }, (_, i) => `l${i}`);
    const far = diffText(L.join("\n"), L.map((l, i) => (i === 2 || i === 17 ? l + "!" : l)).join("\n"));
    expect(far.hunks.map((h) => h.header)).toEqual(["@@ -1,6 +1,6 @@", "@@ -15,6 +15,6 @@"]);
    expect(diffText(undefined, "x\ny").hunks[0].header).toBe("@@ -0,0 +1,2 @@");
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

describe("icons", () => {
  const cards: Block = { type: "cards", line: 1, rows: ["- rocket | Fast | x", "- Plain title"], args: {} };
  const src = "# T\n:::cards style=grid\n- rocket | Fast | x\n\n- Plain title\n:::\nafter";
  it("sets a row's icon cell, adding one when missing", () => {
    expect(setRowIcon(src, cards, 0, "lightning")).toBe("# T\n:::cards style=grid\n- lightning | Fast | x\n\n- Plain title\n:::\nafter");
    expect(setRowIcon(src, cards, 1, "star")).toContain("- star | Plain title");
    expect(setRowIcon(src, cards, 5, "star")).toBe(src);
    expect(hasRowIcons(cards)).toBe(true);
    expect(hasRowIcons({ ...cards, type: "flow", mermaid: true })).toBe(false);
  });
  it("inserts inline text at an offset", () => {
    expect(insertAtOffset("ab", 1, ":x:")).toBe("a:x:b");
    expect(insertAtOffset("ab", 99, "!")).toBe("ab!");
  });
  it("ranks icon search results", () => {
    const icons = [
      { name: "rocket-launch", categories: ["objects"], tags: ["space"] },
      { name: "rocket", categories: ["objects"], tags: ["space"] },
      { name: "planet", categories: ["nature"], tags: ["space", "rocketry"] },
      { name: "pocket", categories: ["objects"], tags: [] },
    ];
    expect(searchIcons(icons, "rocket").map((i) => i.name)).toEqual(["rocket", "rocket-launch", "planet"]);
    expect(searchIcons(icons, "launch").map((i) => i.name)).toEqual(["rocket-launch"]);
    expect(searchIcons(icons, "", "nature").map((i) => i.name)).toEqual(["planet"]);
  });
});

describe("snippet search", () => {
  const S = [
    { label: "Cards · grid", cat: "Cards", md: ":::cards" },
    { label: "Mermaid · sequence", cat: "Mermaid", md: "```mermaid\nsequenceDiagram" },
    { label: "Mermaid · pie", cat: "Mermaid", md: "```mermaid\npie" },
    { label: "Stats · big", cat: "Data", md: ":::stats" },
  ];
  it("filters by every word and ranks label matches first", () => {
    expect(searchSnippets(S, "")).toEqual([0, 1, 2, 3]);
    expect(searchSnippets(S, "mermaid")).toEqual([1, 2]);
    expect(searchSnippets(S, "mermaid pie")).toEqual([2]);
    expect(searchSnippets(S, "sequencediagram")).toEqual([1]);
    expect(searchSnippets(S, "grid")).toEqual([0]);
    expect(searchSnippets(S, "zzz")).toEqual([]);
  });
});
