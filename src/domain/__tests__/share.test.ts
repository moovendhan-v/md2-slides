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
    expect(html).toContain('window.__SLIDEWISE_DECK__="abc_-"');
    expect(html.match(/<script>/g)).toHaveLength(2);
  });
});
