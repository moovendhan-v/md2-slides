import { describe, expect, it } from "vitest";
import { parseOutline, serializeOutline } from "@/domain/source/outline";
import { addSlide, appendSegment, moveSegment, moveSlide, removeSegment, removeSlide, setSegmentText } from "@/domain/source/outline-edit";

const DECK = [
  "---",
  "title: Demo",
  "---",
  "",
  "# Intro",
  "Hello there",
  "",
  "---",
  "",
  "## Code & Architecture",
  "",
  "```ts",
  "const a = 1",
  "",
  "---",
  "```",
  "",
  ":::tip",
  "Use strict mode",
  ":::",
  "",
  "---",
  "",
  "## Highlights",
  "| A | B |",
  "| - | - |",
  "| 1 | 2 |",
  "- one",
  "  more",
  "- two",
  "note: say hi",
  "and wave",
].join("\n");

describe("outline", () => {
  it("splits slides (not inside code) and components losslessly", () => {
    const o = parseOutline(DECK);
    expect(o.head).toHaveLength(3);
    expect(o.slides).toHaveLength(3);
    expect(o.slides[1].segments.map((s) => [s.kind, s.label])).toEqual([
      ["heading", "## Code & Architecture"],
      ["code", "ts"],
      ["fence", ":::tip"],
    ]);
    expect(o.slides[2].segments.map((s) => s.kind)).toEqual(["heading", "table", "list", "notes"]);
    expect(o.slides[2].segments[2].lines).toEqual(["- one", "  more", "- two"]);
    expect(serializeOutline(o)).toBe(DECK);
  });

  it("reorders slides", () => {
    const out = parseOutline(moveSlide(DECK, 2, 0));
    expect(out.slides.map((s) => s.segments[0].label)).toEqual(["## Highlights", "# Intro", "## Code & Architecture"]);
    expect(out.head).toHaveLength(3);
    expect(parseOutline(removeSlide(DECK, 1)).slides.map((s) => s.segments[0].label)).toEqual(["# Intro", "## Highlights"]);
  });

  it("moves components within and across slides, keeping notes last", () => {
    const within = parseOutline(moveSegment(DECK, 1, 2, 1, 0)).slides[1].segments;
    expect(within.map((s) => s.kind)).toEqual(["fence", "heading", "code"]);
    const across = parseOutline(moveSegment(DECK, 1, 2, 2, 9)).slides;
    expect(across[1].segments.map((s) => s.kind)).toEqual(["heading", "code"]);
    expect(across[2].segments.map((s) => s.kind)).toEqual(["heading", "table", "list", "fence", "notes"]);
    expect(moveSegment(DECK, 1, 1, 1, 1)).toBe(DECK);
  });

  it("edits, removes and appends components", () => {
    const edited = parseOutline(setSegmentText(DECK, 0, 1, "Hi **all**")).slides[0].segments;
    expect(edited[1].lines).toEqual(["Hi **all**"]);
    expect(parseOutline(removeSegment(DECK, 2, 1)).slides[2].segments.map((s) => s.kind)).toEqual(["heading", "list", "notes"]);
    const added = addSlide(DECK, "## New");
    expect(added.endsWith("and wave\n\n---\n\n## New\n")).toBe(true);
    expect(parseOutline(appendSegment(DECK, 2, "> quote")).slides[2].segments.map((s) => s.kind)).toEqual(["heading", "table", "list", "quote", "notes"]);
  });
});
