import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { decodeShare } from "@/domain/share/codec";
import { loadNodeEngine } from "@/engine/node";
import { resolveInRoot, validateDeck, writeDeck, type Context } from "../handlers";

const engine = loadNodeEngine(() => readFileSync(join(process.cwd(), "public/wasm/slide_engine_bg.wasm")));
const ctx = (): Context => ({ engine, root: mkdtempSync(join(tmpdir(), "m2s-mcp-")), appUrl: "https://example.test/" });
const GOOD = "# Hello\nIntro\n\n---\n\n## Two\n- a\n- b\n";

describe("md2slides MCP handlers", () => {
  it("validates decks with the engine", () => {
    expect(validateDeck(ctx(), GOOD)).toMatchObject({ ok: true, slides: 2, titles: ["Hello", "Two"] });
    const bad = validateDeck(ctx(), "# X\n:::nope\n- a\n:::\n");
    expect(bad.ok).toBe(false);
    expect(bad.problems[0]).toMatchObject({ line: 2, severity: "error" });
  });

  it("writes a deck into the workspace and returns a working preview link", async () => {
    const c = ctx();
    const r = await writeDeck(c, { path: "decks/intro.md", markdown: GOOD }, "create");
    expect(r.written).toBe(true);
    expect(readFileSync(join(c.root, "decks/intro.md"), "utf8")).toBe(GOOD);
    if (!r.written) return;
    expect(r.preview.startsWith("https://example.test/v#")).toBe(true);
    const payload = await decodeShare(r.preview.split("#")[1]);
    expect(payload).toMatchObject({ md: GOOD, path: "decks/intro.md", name: "intro" });
  });

  it("refuses unsafe paths, accidental overwrites and invalid decks", async () => {
    const c = ctx();
    expect(() => resolveInRoot(c.root, "../escape.md")).toThrow(/inside the workspace/);
    expect(() => resolveInRoot(c.root, "/etc/x.md")).toThrow(/relative/);
    expect(() => resolveInRoot(c.root, "notes.txt")).toThrow(/\.md/);
    writeFileSync(join(c.root, "a.md"), "old");
    await expect(writeDeck(c, { path: "a.md", markdown: GOOD }, "create")).rejects.toThrow(/already exists/);
    await expect(writeDeck(c, { path: "missing.md", markdown: GOOD }, "update")).rejects.toThrow(/does not exist/);
    const invalid = await writeDeck(c, { path: "b.md", markdown: "# X\n:::nope\n:::\n" }, "create");
    expect(invalid.written).toBe(false);
    const forced = await writeDeck(c, { path: "b.md", markdown: "# X\n:::nope\n:::\n", force: true }, "create");
    expect(forced.written).toBe(true);
    const updated = await writeDeck(c, { path: "a.md", markdown: GOOD }, "update");
    expect(updated.written).toBe(true);
  });
});
