import { describe, expect, it } from "vitest";
import type { Block, Deck, Slide } from "@/engine/types";
import { deckOptions } from "@/domain/deck/look";
import { paginate, partLetters, slideNumber, sourceCount } from "@/domain/deck/paginate";

const o = deckOptions({});
const para = (line: number, words = 40): Block => ({ type: "para", line, text: "lorem ipsum ".repeat(words) });
const slide = (groups: Block[][], extra: Partial<Slide> = {}): Slide => ({ startLine: 0, title: "Title", titleLine: 0, kicker: "", body: "", groups, notes: "note", layout: "", dir: {}, ...extra });
const deck = (...slides: Slide[]): Deck => ({ meta: {}, problems: [], slides });

describe("paginate", () => {
  it("keeps slides that fit", () => {
    const d = paginate(deck(slide([[para(1, 5)]])), o);
    expect(d.slides).toHaveLength(1);
    expect(slideNumber(d.slides[0], 0)).toBe("01");
  });

  it("splits long text into lettered continuation parts", () => {
    const d = paginate(deck(slide([Array.from({ length: 12 }, (_, i) => para(i + 1))]), slide([[para(20, 3)]])), o);
    expect(d.slides.length).toBeGreaterThan(2);
    expect(d.slides.map((s, i) => slideNumber(s, i)).slice(0, 2)).toEqual(["01a", "01b"]);
    expect(slideNumber(d.slides[d.slides.length - 1], d.slides.length - 1)).toBe("02");
    expect(sourceCount(d)).toBe(2);
    expect(d.slides[1].notes).toBe("");
    expect(d.slides[1].title).toBe("Title");
    expect(d.slides[1].anchorLine).toBeGreaterThan(1);
  });

  it("cuts oversized code blocks by line and keeps numbering", () => {
    const code: Block = { type: "code", line: 3, code: Array.from({ length: 60 }, (_, i) => `line ${i}`), lang: "ts", args: { style: "chrome" } };
    const d = paginate(deck(slide([[code]])), o);
    expect(d.slides.length).toBeGreaterThan(1);
    const chunks = d.slides.map((s) => s.groups[0][0]);
    expect(chunks.reduce((n, c) => n + (c.code?.length ?? 0), 0)).toBe(60);
    expect(chunks[1].codeOffset).toBe(chunks[0].code!.length);
    expect(chunks[1].source).toBe(code);
  });

  it("respects split: false and multi-column slides", () => {
    const long = Array.from({ length: 12 }, (_, i) => para(i + 1));
    expect(paginate(deck(slide([long], { dir: { split: "false" } })), o).slides).toHaveLength(1);
    expect(paginate(deck(slide([long, [para(30)]])), o).slides).toHaveLength(1);
  });

  it("numbers parts past z as aa, ab …", () => {
    expect([0, 25, 26, 27, 51, 52].map(partLetters)).toEqual(["a", "z", "aa", "ab", "az", "ba"]);
  });

  it("moves a section that would be split to a fresh page", () => {
    const h = (line: number): Block => ({ type: "heading", line, text: "Section" });
    // A full-ish page, then a heading whose section fits a page on its own but not the remainder.
    const d = paginate(deck(slide([[para(1, 40), h(3), para(4, 25), para(5, 25)]])), o);
    const firstOf = (t: Block["type"]) => d.slides.findIndex((s) => s.groups[0].some((b) => b.type === t));
    const sec = d.slides[firstOf("heading")].groups[0];
    expect(sec[0].type).toBe("heading");
    expect(sec.map((b) => b.line)).toEqual([3, 4, 5]);
  });
});

