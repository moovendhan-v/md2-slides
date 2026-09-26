/**
 * Captures the real app for the video: one clip per scene, driven by a
 * scripted cursor against a mocked GitHub repo (no sign-in needed).
 *
 *   node video/capture.mjs [clip...]      (app must be running, see README)
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { deflateRawSync } from "node:zlib";
import { deck, mockApp } from "./lib/mock.mjs";
import { prepareContext, Recorder } from "./lib/recorder.mjs";

const HERE = new URL(".", import.meta.url).pathname;
const APP = process.env.APP_URL ?? "http://localhost:3100";
export const VIEWPORT = { width: 1600, height: 900 };
const DPR = 1.5;

const FULL = deck("acme-q3.md");
const [HEAD, TITLE] = FULL.split(/\n---\n/);
const START = `${HEAD}\n---\n${TITLE}`.trimEnd() + "\n";

async function open(browser, files, path = "/app") {
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: DPR, reducedMotion: "no-preference", ignoreHTTPSErrors: true });
  await prepareContext(context);
  await mockApp(context, () => files);
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  page.on("pageerror", (e) => console.log("  page error:", e.message));
  await page.goto(APP + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  return page;
}

/** Opens a deck in the editor with a tidy layout (customizer closed, focus preview). */
async function openDeck(page, name, { focus = true, custom = false } = {}) {
  await page.getByRole("row", { name: new RegExp(name) }).click();
  await page.locator('textarea[aria-label="Deck Markdown"]').waitFor();
  await page.waitForTimeout(1200);
  if (!custom && (await page.getByLabel("Close customizer").count())) await page.getByLabel("Close customizer").click();
  if (focus) await page.getByRole("button", { name: "Focus" }).click();
  await page.waitForTimeout(500);
}

const editor = (page) => page.locator('textarea[aria-label="Deck Markdown"]');
const region = async (page, sel) => page.locator(sel).first().boundingBox();

/** Largest visible match (skips tiny strip thumbnails and hidden copies). */
async function biggest(locator, where = () => true) {
  const all = await locator.all();
  let best = null;
  let area = 0;
  for (const l of all) {
    const b = await l.boundingBox().catch(() => null);
    if (b && where(b) && b.width * b.height > area) [best, area] = [l, b.width * b.height];
  }
  if (!best) throw new Error("no visible match");
  return best;
}

/** Union of two boxes (for camera framing). */
const union = (a, b) => {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, width: Math.max(a.x + a.width, b.x + b.width) - x, height: Math.max(a.y + a.height, b.y + b.height) - y };
};

const CLIPS = {
  /** Type a new slide; the preview follows keystroke by keystroke. */
  async live(browser, rec) {
    const page = await open(browser, { "decks/acme-q3.md": START, "README.md": "# Platform\n" });
    await openDeck(page, "acme-q3");
    rec = rec(page);
    await rec.start();
    const ed = await editor(page).boundingBox();
    const hint = await region(page, "main >> text=Click any block");
    await rec.focus(union(ed, { ...hint, height: ed.height - 60 }), { scale: 1.35, pad: 10 });
    await rec.click(editor(page), { dy: 120 });
    await page.keyboard.press("Control+End");
    await rec.wait(300);
    rec.mark("type");
    await rec.type("\n---\n\n## Results\n\n:::stats style=big\n- 4 min | CI time, was 38\n- 0 | Incidents in 90 days\n- 12 | Releases per week\n:::", { min: 14, max: 34 });
    rec.mark("typed");
    await rec.wait(500);
    await page.locator("main").getByText("Releases per week").first().waitFor();
    const pv = await region(page, "main >> text=Click any block");
    await rec.focus({ x: pv.x, y: pv.y + 30, width: pv.width, height: pv.width * 0.6 }, { scale: 1.6, pad: 10 });
    await rec.wait(1600);
    return rec.stop();
  },

  /** Click a block → variant picker; switch the accent colour. */
  async restyle(browser, rec) {
    const page = await open(browser, { "decks/acme-q3.md": FULL });
    await openDeck(page, "acme-q3", { custom: true });
    // Put the caret on the Results slide so the focus preview shows it.
    await editor(page).click();
    await page.keyboard.press("Control+Home");
    for (let i = 0; i < 18; i++) await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(600);
    rec = rec(page);
    await rec.start();
    const stats = await biggest(page.locator("main").getByText("Incidents in 90 days"), (b) => b.x > VIEWPORT.width / 2);
    await rec.focus(await region(page, "main >> text=Click any block").then(async (b) => union(b, await stats.boundingBox())), { scale: 1.5, pad: 60 });
    await rec.click(stats, { after: 700 });
    const dialog = page.getByRole("dialog");
    await rec.focus(dialog, { scale: 1.45, pad: 30 });
    const variant = (name) => dialog.locator("button", { has: page.getByText(name, { exact: true }) });
    await rec.moveTo(variant("plain"), { ms: 500 });
    await rec.click(variant("bar"), { after: 1100 });
    if (await dialog.count()) await page.keyboard.press("Escape");
    await rec.wait(300);
    await rec.focus(null);
    await rec.focus(await page.getByText("Palette", { exact: true }).boundingBox().then((b) => ({ x: b.x - 20, y: b.y - 20, width: 300, height: 320 })), { scale: 1.25, pad: 0 });
    await rec.click(page.locator('button[title="#a78bfa"]'), { after: 700 });
    await rec.click(page.getByText("Slate", { exact: true }).first(), { after: 1200 });
    return rec.stop();
  },

  /** Components view: drag a slide above another. */
  async components(browser, rec) {
    const page = await open(browser, { "decks/acme-q3.md": FULL });
    await openDeck(page, "acme-q3", { focus: false });
    rec = rec(page);
    await rec.start();
    const btn = page.getByRole("button", { name: "Components" });
    await rec.click(btn, { after: 700 });
    const panel = await page.getByText("COMPONENT VIEW", { exact: false }).first().boundingBox();
    await rec.focus({ x: panel.x - 10, y: 100, width: 460, height: 760 }, { scale: 1.45, pad: 0 });
    // Scroll so slides 2 and 3 headers are both visible.
    await page.locator('[data-slide="1"]').scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 0);
    await rec.wait(400);
    const from = page.locator('[data-slide="2"] header');
    const to = page.locator('[data-slide="1"] header');
    await from.scrollIntoViewIfNeeded();
    await rec.wait(300);
    const fb = await from.boundingBox();
    const tb = await to.boundingBox();
    await rec.moveTo({ x: fb.x + 60, y: fb.y + fb.height / 2 });
    await page.mouse.down();
    rec.cues.push({ t: rec.now(), type: "click" });
    await rec.moveTo({ x: tb.x + 60, y: tb.y + 4 }, { ms: 1100 });
    await rec.wait(250);
    await page.mouse.up();
    await rec.wait(1300);
    return rec.stop();
  },

  /** Slash menu → search "mermaid"; then the icon catalogue. */
  async slash(browser, rec) {
    const page = await open(browser, { "decks/acme-q3.md": START + "\n---\n\n## How a deploy flows\n\n" });
    await openDeck(page, "acme-q3");
    await editor(page).click();
    await page.keyboard.press("Control+End");
    await page.waitForTimeout(500);
    rec = rec(page);
    await rec.start();
    const ed = await editor(page).boundingBox();
    await rec.focus({ x: ed.x, y: ed.y, width: 1100, height: 560 }, { scale: 1.4, pad: 10 });
    await rec.press("/");
    await rec.wait(700);
    const search = page.getByLabel("Search blocks");
    await rec.type("flow", { min: 90, max: 140 });
    await rec.wait(700);
    await rec.press("Enter");
    await page.locator("main .m2s-mermaid svg").first().waitFor({ timeout: 15000 });
    await rec.wait(900);
    const pv = await region(page, "main >> text=Click any block");
    await rec.focus({ x: pv.x, y: pv.y, width: 420, height: 420 }, { scale: 1.5, pad: 20 });
    await rec.wait(900);
    await rec.focus(null);
    await rec.click(page.getByTitle("Insert an icon at the cursor (:name:)"), { after: 300 });
    await page.getByRole("option").first().waitFor({ timeout: 15000 });
    await rec.wait(500);
    await rec.focus(await page.getByLabel("Search icons").boundingBox().then((b) => ({ ...b, height: 380 })), { scale: 1.6, pad: 30 });
    await rec.type("rocket", { min: 90, max: 140 });
    await rec.wait(900);
    await page.keyboard.press("Escape");
    await rec.wait(300);
    void search;
    return rec.stop();
  },

  /** Commit dialog with the git diff, then push. */
  async commit(browser, rec) {
    const page = await open(browser, { "decks/acme-q3.md": START });
    await openDeck(page, "acme-q3");
    await editor(page).click();
    await page.keyboard.press("Control+End");
    await page.keyboard.insertText("\n---\n\n## Results\n\n:::stats style=big\n- 4 min | CI time, was 38\n- 12 | Releases per week\n:::\n");
    await page.waitForTimeout(900);
    rec = rec(page);
    await rec.start();
    await rec.click(page.getByRole("button", { name: "Commit" }).first(), { after: 800 });
    const dialog = page.getByRole("dialog");
    await rec.focus(dialog, { scale: 1.5, pad: 30 });
    const file = dialog.getByText("acme-q3.md").first();
    await rec.click(file, { after: 1200 });
    await rec.focus(dialog, { scale: 1.3, pad: 20 });
    await rec.click(dialog.getByRole("button", { name: /Push to GitHub|Open pull request/ }), { after: 400 });
    await rec.focus(null);
    await rec.wait(1600);
    return rec.stop();
  },

  /** Share link: the deck travels in the URL; open it in the viewer. */
  async share(browser, rec) {
    const page = await open(browser, { "decks/acme-q3.md": FULL });
    await openDeck(page, "acme-q3");
    rec = rec(page);
    await rec.start();
    await rec.click(page.getByTitle("Share a view-only link"), { after: 900 });
    const dialog = page.getByRole("dialog");
    await rec.focus(dialog, { scale: 1.5, pad: 30 });
    const input = dialog.getByLabel("Share link");
    await page.waitForFunction(() => document.querySelector('input[aria-label="Share link"]')?.value.includes("#"));
    const url = await input.inputValue();
    await rec.click(dialog.getByPlaceholder("No password"), { after: 200 });
    await rec.type("acme", { min: 50, max: 80 });
    await rec.wait(500);
    const copy = dialog.getByRole("button", { name: /copy/i }).first();
    await rec.click(copy, { after: 900 });
    await rec.focus(null);
    rec.mark("viewer");
    await page.goto(url.replace(/^https?:\/\/[^/]+/, APP), { waitUntil: "networkidle" });
    await rec.wait(1200);
    await rec.press("ArrowRight");
    await rec.wait(1400);
    return rec.stop();
  },

  /** The deck Claude wrote shows up in the repo dashboard. */
  async dashboard(browser, rec) {
    const files = { "decks/acme-q3.md": FULL, "decks/launch-plan.md": deck("launch-plan.md"), "README.md": "# Platform\n" };
    const page = await open(browser, files);
    rec = rec(page);
    await rec.start();
    const row = page.getByRole("row", { name: /launch-plan/ });
    await rec.focus(await page.locator("table").boundingBox(), { scale: 1.35, pad: 40 });
    await rec.moveTo(row, { ms: 900 });
    await rec.wait(500);
    await rec.click(row, { after: 1600 });
    await page.getByLabel("Close customizer").click().catch(() => {});
    await rec.focus(null);
    await rec.wait(1600);
    return rec.stop();
  },

  /** Landing: community templates with author credit, then contribute & donate. */
  async community(browser, rec) {
    const page = await open(browser, {}, "/");
    await page.evaluate(() => document.getElementById("templates")?.scrollIntoView());
    await page.waitForTimeout(400);
    await page.evaluate(() => scrollTo(0, document.getElementById("templates").offsetTop - 900));
    await page.waitForTimeout(600);
    rec = rec(page);
    await rec.start();
    const glide = (top, ms) =>
      page.evaluate(
        ([top, ms]) =>
          new Promise((done) => {
            const from = scrollY;
            const t0 = performance.now();
            const step = (t) => {
              const k = Math.min(1, (t - t0) / ms);
              scrollTo(0, from + (top - from) * (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2));
              if (k < 1) requestAnimationFrame(step);
              else done();
            };
            requestAnimationFrame(step);
          }),
        [top, ms],
      );
    await glide(await page.evaluate(() => document.getElementById("templates").offsetTop - 40), 1600);
    const author = page.locator("#templates a[href*='github.com']").first();
    if (await author.count()) {
      await rec.focus(await page.locator("#templates").boundingBox().then((b) => ({ ...b, height: Math.min(b.height, 760) })), { scale: 1.2, pad: 0 });
      await rec.moveTo(author, { ms: 800 });
      await rec.wait(1200);
    }
    await rec.focus(null);
    await glide(await page.evaluate(() => document.getElementById("contribute").offsetTop - 30), 1700);
    const donate = page.locator("#contribute a", { hasText: /Sponsor/i }).first();
    if (await donate.count()) await rec.moveTo(donate, { ms: 800 });
    await rec.wait(1600);
    return rec.stop();
  },
};

/** Share-link hash (same format as src/domain/share/codec.ts). */
const shareHash = (md, path) =>
  Buffer.concat([Buffer.from([1, 0]), deflateRawSync(Buffer.from(JSON.stringify({ v: 1, md, path, name: path, created: Date.UTC(2026, 8, 26), opts: { notes: false, download: true, present: false } })))]).toString("base64url");

/** Every slide of the demo decks as PNGs, for the motion-graphics scenes. */
async function stills(browser) {
  const out = join(HERE, ".cache/stills");
  mkdirSync(out, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  for (const [name, md] of [["acme", FULL], ["launch", deck("launch-plan.md")]]) {
    await page.goto(`${APP}/v#${shareHash(md, name + ".md")}`, { waitUntil: "networkidle" });
    const slides = page.locator("main section [style*='aspect-ratio']");
    await slides.first().waitFor();
    await page.waitForTimeout(1500);
    const n = await slides.count();
    for (let i = 0; i < n; i++) {
      await slides.nth(i).scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await slides.nth(i).screenshot({ path: join(out, `${name}-${i + 1}.png`) });
    }
    console.log(`stills: ${name} ${n} slides`);
  }
  await context.close();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const want = process.argv.slice(2);
  // Through the environment's proxy (if any) so Google Fonts load: the app renders with its real type.
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "<-loopback>,localhost,127.0.0.1" } : undefined;
  const browser = await chromium.launch({ args: ["--force-color-profile=srgb", "--hide-scrollbars", "--ignore-certificate-errors"], proxy });
  if (!want.length || want.includes("stills")) await stills(browser);
  for (const [name, run] of Object.entries(CLIPS)) {
    if (want.length ? !want.includes(name) : false) continue;
    const t = Date.now();
    try {
      const meta = await run(browser, (page) => new Recorder(page, join(HERE, ".cache/clips", name)));
      console.log(`clip: ${name.padEnd(11)} ${(meta.duration / 1000).toFixed(1)}s, ${meta.frames.length} frames (${((Date.now() - t) / 1000).toFixed(0)}s)`);
    } catch (e) {
      console.log(`clip: ${name} FAILED: ${e.message.split("\n")[0]} @ ${(e.stack.match(/capture\.mjs:\d+/g) ?? []).join(" ")}`);
      process.exitCode = 1;
    }
  }
  await browser.close();
}
