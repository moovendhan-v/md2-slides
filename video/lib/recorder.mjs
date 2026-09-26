/**
 * Records a Playwright page as a sequence of high-quality JPEG frames via the
 * Chrome DevTools screencast (much sharper than `recordVideo`), plus a log of
 * camera cues (`focus` rects), cursor clicks and key taps with timestamps. The
 * compositor (stage/) replays the frames on a time line.
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Fake macOS-style cursor + click ripple drawn into the page (real mouse events drive it). */
const CURSOR_JS = `(() => {
  if (window.__m2sCursor) return; window.__m2sCursor = 1;
  const add = () => {
    const c = document.createElement('div');
    c.id = '__m2s_cursor';
    c.innerHTML = '<svg width="28" height="28" viewBox="0 0 28 28"><path d="M5 3l17 10.5-7.6 1.4 4.6 8.6-3.3 1.7-4.6-8.7L5 22z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, { position: 'fixed', left: '0', top: '0', zIndex: 2147483647, pointerEvents: 'none', transform: 'translate(-100px,-100px)', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.45))', transition: 'none' });
    document.documentElement.appendChild(c);
    const st = document.createElement('style');
    st.textContent = 'nextjs-portal{display:none!important} @keyframes __m2s_rip{from{transform:translate(-50%,-50%) scale(.2);opacity:.75}to{transform:translate(-50%,-50%) scale(1);opacity:0}} ::-webkit-scrollbar{width:0;height:0}';
    document.documentElement.appendChild(st);
    addEventListener('mousemove', e => { c.style.transform = 'translate(' + (e.clientX - 5) + 'px,' + (e.clientY - 3) + 'px)'; }, true);
    addEventListener('mousedown', e => {
      const r = document.createElement('div');
      Object.assign(r.style, { position: 'fixed', left: e.clientX + 'px', top: e.clientY + 'px', width: '46px', height: '46px', borderRadius: '50%', border: '2px solid rgba(96,165,250,.95)', background: 'rgba(96,165,250,.18)', zIndex: 2147483646, pointerEvents: 'none', animation: '__m2s_rip .55s ease-out forwards' });
      document.documentElement.appendChild(r); setTimeout(() => r.remove(), 700);
    }, true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add); else add();
})();`;

export async function prepareContext(context) {
  await context.addInitScript(CURSOR_JS);
}

const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);

export class Recorder {
  constructor(page, dir) {
    this.page = page;
    this.dir = dir;
    this.frames = [];
    this.cues = [];
    this.mouse = { x: 800, y: 450 };
  }

  async start() {
    rmSync(this.dir, { recursive: true, force: true });
    mkdirSync(this.dir, { recursive: true });
    this.cdp = await this.page.context().newCDPSession(this.page);
    const vp = this.page.viewportSize();
    this.vp = vp;
    let n = 0;
    this.cdp.on("Page.screencastFrame", async ({ data, sessionId, metadata }) => {
      const file = `${String(n++).padStart(5, "0")}.jpg`;
      writeFileSync(join(this.dir, file), Buffer.from(data, "base64"));
      this.frames.push({ t: (metadata.timestamp ?? Date.now() / 1000) * 1000, file });
      await this.cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
    });
    const dpr = await this.page.evaluate(() => devicePixelRatio);
    await this.cdp.send("Page.startScreencast", { format: "jpeg", quality: 90, maxWidth: Math.round(vp.width * dpr), maxHeight: Math.round(vp.height * dpr), everyNthFrame: 1 });
    this.t0 = Date.now();
    await this.page.mouse.move(this.mouse.x, this.mouse.y);
    await this.wait(300);
  }

  now() {
    return Date.now() - this.t0;
  }

  wait(ms) {
    return this.page.waitForTimeout(ms);
  }

  /** Camera cue: zoom to the element (or rect), `scale` caps the zoom. `null` = whole screen. */
  async focus(target, { scale = 1.8, pad = 40 } = {}) {
    let rect = null;
    if (target) {
      const box = typeof target.boundingBox === "function" ? await target.boundingBox() : target;
      rect = { x: box.x - pad, y: box.y - pad, w: box.width + pad * 2, h: box.height + pad * 2 };
    }
    this.cues.push({ t: this.now(), type: "focus", rect, scale });
  }

  /** Narration beat (lets the compositor sync a caption/callout to this moment). */
  mark(name, extra = {}) {
    this.cues.push({ t: this.now(), type: "mark", name, ...extra });
  }

  /** Smooth, eased cursor move to an element's centre (or a point). */
  async moveTo(target, { ms = 650, dx = 0, dy = 0 } = {}) {
    let x, y;
    if (typeof target.boundingBox === "function") {
      const b = await target.boundingBox();
      x = b.x + b.width / 2 + dx;
      y = b.y + b.height / 2 + dy;
    } else ({ x, y } = target);
    const from = { ...this.mouse };
    const dist = Math.hypot(x - from.x, y - from.y);
    // Clock-based: however slow each mouse event is, the move takes `ms`.
    const t0 = Date.now();
    for (;;) {
      const k = ease(Math.min(1, (Date.now() - t0) / ms));
      // Slight arc, like a hand.
      const arc = Math.sin(Math.PI * k) * Math.min(40, dist * 0.08);
      await this.page.mouse.move(from.x + (x - from.x) * k, from.y + (y - from.y) * k - arc);
      if (k >= 1) break;
      await this.page.waitForTimeout(8);
    }
    this.mouse = { x, y };
  }

  async click(target, opts = {}) {
    await this.moveTo(target, opts);
    await this.wait(120);
    this.cues.push({ t: this.now(), type: "click" });
    await this.page.mouse.down();
    await this.wait(70);
    await this.page.mouse.up();
    await this.wait(opts.after ?? 350);
  }

  /** Types like a person (key sounds are cued for the mix). */
  async type(text, { min = 35, max = 85 } = {}) {
    // Keys land on a schedule (not "after the previous key finished").
    let due = Date.now();
    for (const ch of text) {
      due += min + Math.random() * (max - min) + (ch === "\n" ? 140 : 0);
      if (ch === "\n") await this.page.keyboard.press("Enter");
      else await this.page.keyboard.insertText(ch);
      this.cues.push({ t: this.now(), type: "key" });
      const wait = due - Date.now();
      if (wait > 0) await this.page.waitForTimeout(wait);
    }
  }

  async press(key) {
    this.cues.push({ t: this.now(), type: "key" });
    await this.page.keyboard.press(key);
  }

  async stop() {
    await this.wait(400);
    await this.cdp.send("Page.stopScreencast");
    await this.wait(200);
    const t0 = this.frames[0]?.t ?? 0;
    const offset = this.t0 - t0; // wall clock of start vs first frame
    const frames = this.frames.map((f) => ({ t: Math.round(f.t - t0), file: f.file }));
    const cues = this.cues.map((c) => ({ ...c, t: Math.round(c.t + offset) }));
    const meta = { viewport: this.vp, duration: this.now() + offset, frames, cues };
    writeFileSync(join(this.dir, "index.json"), JSON.stringify(meta));
    return meta;
  }
}
