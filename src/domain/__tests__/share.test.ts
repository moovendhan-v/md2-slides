import { describe, expect, it } from "vitest";
import { decodeShare, encodeShare, linkHealth, needsPassword, ShareDecodeError } from "@/domain/share/codec";
import { collectImports, expiresAt, expiresIn, isExpired, relativeImages, type SharePayload } from "@/domain/share/payload";

const payload: SharePayload = {
  v: 1,
  md: "# Hello\n\n---\n\n## Two\n- a\n- b\n".repeat(20),
  path: "decks/q3.md",
  name: "q3",
  created: 1_700_000_000_000,
  opts: { notes: false, download: true, present: false },
};

describe("share codec", () => {
  it("round-trips and compresses, with URL-safe output", async () => {
    const s = await encodeShare(payload);
    expect(s).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(s.length).toBeLessThan(payload.md.length / 2);
    expect(needsPassword(s)).toBe(false);
    expect(await decodeShare(s)).toEqual(payload);
  });

  it("encrypts with a password and rejects a wrong or missing one", async () => {
    const s = await encodeShare(payload, "hunter2");
    expect(needsPassword(s)).toBe(true);
    expect(await decodeShare(s, "hunter2")).toEqual(payload);
    await expect(decodeShare(s, "nope")).rejects.toMatchObject({ reason: "password" });
    await expect(decodeShare(s)).rejects.toBeInstanceOf(ShareDecodeError);
  });

  it("rejects damaged links", async () => {
    const s = await encodeShare(payload);
    await expect(decodeShare(s.slice(0, 20))).rejects.toMatchObject({ reason: "corrupt" });
    await expect(decodeShare("AgA")).rejects.toMatchObject({ reason: "version" });
  });

  it("grades link length", () => {
    expect(linkHealth("x".repeat(100))).toBe("ok");
    expect(linkHealth("x".repeat(9000))).toBe("long");
  });
});

describe("share payload helpers", () => {
  it("handles expiry", () => {
    const now = 1_000_000;
    expect(expiresAt("never", now)).toBeUndefined();
    const p = { expires: expiresAt("1h", now) };
    expect(isExpired(p, now + 1000)).toBe(false);
    expect(isExpired(p, now + 3_600_001)).toBe(true);
    expect(expiresIn(p, now)).toBe("in 1 hour");
    expect(expiresIn({ expires: now + 3 * 86_400_000 }, now)).toBe("in 3 days");
  });

  it("collects imported files", () => {
    const md = "<!-- src: ./intro.md -->\n---\n```ts\n```\n<<< src/app.ts#L1-3\n<<< missing.ts";
    const files = { "decks/intro.md": "# Intro", "src/app.ts": "code" };
    const resolve = (ref: string, kind: "src" | "import") => (kind === "src" ? `decks/${ref.slice(2)}` : ref);
    expect(collectImports(md, resolve, (p) => files[p as keyof typeof files])).toEqual(files);
  });

  it("lists images viewers can't load", () => {
    expect(relativeImages("![a](./img/a.png) ![b](https://x.io/b.png) ![c](data:image/png;base64,x) ![d](img/a.png){w=50}")).toEqual(["./img/a.png", "img/a.png"]);
  });
});

describe("standalone HTML export", () => {
  it("inlines parts safely", async () => {
    const { standaloneHtml, bytesToBase64 } = await import("@/domain/export/standalone-html");
    expect(bytesToBase64(new Uint8Array([104, 105]))).toBe("aGk=");
    const html = standaloneHtml({ title: "Q3 <review>", js: 'x("</script>")', css: ["a{}</style>"], wasmBase64: "AAA", encoded: "abc_-" });
    expect(html).toContain("<title>Q3 &lt;review&gt;</title>");
    expect(html).toContain('x("<\\/script>")');
    expect(html).toContain("a{}<\\/style>");
    expect(html).toContain('window.__MD2SLIDES_DECK__="abc_-"');
    expect(html.match(/<script>/g)).toHaveLength(2);
  });
});

describe("storage migration after the rename", () => {
  it("moves a localStorage key once", async () => {
    const { migrateLocalStorageKey } = await import("@/lib/storage");
    const m = new Map<string, string>([["slidewise-prefs", '{"a":1}']]);
    const store = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
    migrateLocalStorageKey("slidewise-prefs", "md2slides-prefs", store);
    expect([...m.entries()]).toEqual([["md2slides-prefs", '{"a":1}']]);
    migrateLocalStorageKey("slidewise-prefs", "md2slides-prefs", store);
    expect(m.get("md2slides-prefs")).toBe('{"a":1}');
    // an existing new value wins
    m.set("slidewise-prefs", "old");
    migrateLocalStorageKey("slidewise-prefs", "md2slides-prefs", store);
    expect(m.get("md2slides-prefs")).toBe('{"a":1}');
    expect(m.has("slidewise-prefs")).toBe(false);
  });

  it("moves an async (IndexedDB) value on first read", async () => {
    const { migrateAsync } = await import("@/lib/storage");
    const db = new Map<string, number>([["old", 7]]);
    const io = { get: async (k: string) => db.get(k), set: async (k: string, v: number) => void db.set(k, v), del: async (k: string) => void db.delete(k) };
    expect(await migrateAsync("new", "old", io)).toBe(7);
    expect([...db.keys()]).toEqual(["new"]);
    expect(await migrateAsync("new", "old", io)).toBe(7);
  });
});

describe("author credit", () => {
  it("builds GitHub profile and avatar URLs only for valid handles", async () => {
    const { githubProfile } = await import("@/lib/github");
    expect(githubProfile("moovendhan-v", 40)).toEqual({ url: "https://github.com/moovendhan-v", avatar: "https://github.com/moovendhan-v.png?size=40" });
    expect(githubProfile("bad handle")).toBeUndefined();
    expect(githubProfile("-leading")).toBeUndefined();
    expect(githubProfile(undefined)).toBeUndefined();
  });
});

describe("landing live-demo typing", () => {
  it("edits toward the target like a person", async () => {
    const { typingStep, lineOf } = await import("@/features/landing/typing");
    const run = (from: string, to: string) => {
      const seen = [from];
      let s = { text: from, caret: 0 };
      for (let i = 0; i < 200 && s.text !== to; i++) seen.push((s = typingStep(s.text, to)).text);
      return seen;
    };
    expect(run("", "ab")).toEqual(["", "a", "ab"]);
    const steps = run("theme: zinc\n# T", "theme: midnight\n# T");
    expect(steps.at(-1)).toBe("theme: midnight\n# T");
    expect(steps).toContain("theme: \n# T");
    expect(steps.every((t) => t.endsWith("\n# T"))).toBe(true);
    expect(typingStep("abc", "abc")).toEqual({ text: "abc", caret: 3 });
    expect(lineOf("a\nb\nc", 3)).toBe(1);
  });
});
