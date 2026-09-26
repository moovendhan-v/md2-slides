/**
 * Renders the product video: builds the time line from the storyboard and the
 * narration lengths, composites every frame in the HTML stage (Playwright),
 * encodes with ffmpeg, then mixes voice, music (ducked) and sound effects.
 *
 *   node video/render.mjs [--vertical] [--only live,share] [--fps 30] [--draft]
 */
import { execFileSync, spawn } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright";
import { SCENES, TRANSITION, VERTICAL } from "./storyboard.mjs";
import { renderVoice } from "./voice.mjs";

const HERE = new URL(".", import.meta.url).pathname;
const ROOT = join(HERE, "..");
const CACHE = join(HERE, ".cache");
const OUT = join(HERE, "out");
const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i < 0 ? def : process.argv[i + 1];
};
const VERT = process.argv.includes("--vertical");
const DRAFT = process.argv.includes("--draft");
const FPS = Number(arg("fps", DRAFT ? 15 : 30));
const ONLY = arg("only", "")?.split(",").filter(Boolean);
const FFMPEG = process.env.FFMPEG ?? execFileSync("python3", ["-c", "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"]).toString().trim();

const LEAD = 0.35;
const CLIP_URL = { community: "www.md2slides.cyertechmind.com", share: "www.md2slides.cyertechmind.com/app" };

/** Scene list with absolute times, clip timing and caption text. */
function timeline(voice) {
  let ids = VERT ? VERTICAL : SCENES.map((s) => s.id);
  if (ONLY?.length) ids = ids.filter((id) => ONLY.includes(id));
  let t = 0;
  let n = 0;
  const stills = (p, k) => Array.from({ length: k }, (_, i) => `/video/.cache/stills/${p}-${i + 1}.png`);
  const scenes = ids.map((id) => {
    const s = SCENES.find((x) => x.id === id);
    const lead = id === "hook" ? 0.55 : LEAD;
    const voDur = voice[id].seconds;
    const dur = lead + voDur + s.tail;
    const out = { id, start: t, dur, voStart: t + lead, voDur, vo: s.vo, chapter: s.chapter, brand: false, n: s.chapter ? ++n : 0 };
    if (s.visual.clip) {
      const meta = JSON.parse(readFileSync(join(CACHE, "clips", s.visual.clip, "index.json"), "utf8"));
      const start = 0.15;
      const len = meta.duration / 1000 - start - 0.25;
      out.rate = Math.min(1.6, Math.max(0.7, len / dur));
      out.clip = { ...meta, start, url: `/video/.cache/clips/${s.visual.clip}` };
      out.url = CLIP_URL[id] ?? "www.md2slides.cyertechmind.com/app";
    } else out.motionName = s.visual.motion;
    t += dur;
    return out;
  });
  return { scenes, total: t, transition: TRANSITION, portrait: VERT, stills: { acme: stills("acme", 4), launch: stills("launch", 3) } };
}

/** Static files for the stage (stage page, caches, logo, icon font). */
function serve() {
  const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf" };
  const server = createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const file = normalize(join(ROOT, url === "/" ? "/video/stage/index.html" : url));
    if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream", "cache-control": "max-age=3600" });
    createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok(server)));
}

async function frames(data, file) {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const [w, h] = VERT ? [1080, 1920] : [1920, 1080];
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "<-loopback>,localhost,127.0.0.1" } : undefined;
  const browser = await chromium.launch({ args: ["--force-color-profile=srgb", "--ignore-certificate-errors"], proxy });
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
  page.on("pageerror", (e) => console.log("stage error:", e.message));
  await page.goto(`${base}/video/stage/index.html`, { waitUntil: "networkidle" });
  await page.evaluate((d) => window.STAGE.init(d), data);
  const sfx = await page.evaluate(() => window.STAGE.sfx());
  const at = arg("at", "");
  if (at) {
    // Preview mode: a few PNG frames, no encoding.
    for (const t of at.split(",").map(Number)) {
      await page.evaluate((x) => window.STAGE.render(x), t);
      await page.screenshot({ path: join(OUT, `frame-${VERT ? "v-" : ""}${t.toFixed(2)}.png`) });
    }
    await browser.close();
    server.close();
    process.exit(0);
  }

  const ff = spawn(FFMPEG, ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-", "-c:v", "libx264", "-preset", DRAFT ? "veryfast" : "slow", "-crf", DRAFT ? "26" : "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart", file], { stdio: ["pipe", "inherit", "inherit"] });
  const count = Math.ceil(data.total * FPS);
  const t0 = Date.now();
  for (let f = 0; f < count; f++) {
    await page.evaluate((t) => window.STAGE.render(t), f / FPS);
    const jpg = await page.screenshot({ type: "jpeg", quality: DRAFT ? 80 : 94 });
    if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once("drain", r));
    if (f % (FPS * 5) === 0) process.stdout.write(`\rframes: ${f}/${count} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  process.stdout.write(`\rframes: ${count}/${count} (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
  await browser.close();
  server.close();
  return sfx;
}

function audio(data, voice, sfx, name) {
  const dir = join(CACHE, "audio", name); // per output, so renders can run side by side
  const cta = data.scenes.find((s) => s.id === "cta");
  execFileSync("python3", [join(HERE, "music.py"), "--duration", String(data.total), "--cta", String(cta ? cta.start : data.total - 4), "--out", dir], { stdio: "inherit" });
  const plan = { duration: data.total, voice: data.scenes.map((s) => ({ file: voice[s.id].file, t: s.voStart })), sfx, sfxDir: dir, out: dir };
  writeFileSync(join(dir, "plan.json"), JSON.stringify(plan));
  execFileSync("python3", [join(HERE, "mix.py"), join(dir, "plan.json")], { stdio: "inherit" });
  const wav = join(OUT, `${name}.wav`);
  // Music ducks under the voice (sidechain), then everything is normalised for streaming (-14 LUFS).
  execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-i", join(dir, "music.wav"), "-i", join(dir, "voice.wav"), "-i", join(dir, "sfx.wav"), "-filter_complex",
    "[1:a]asplit=2[v][sc];[0:a]volume=0.42[m];[m][sc]sidechaincompress=threshold=0.02:ratio=6:attack=25:release=450[md];[md][v][2:a]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,atrim=0:" + data.total.toFixed(3) + "[a]",
    "-map", "[a]", "-ar", "48000", wav]);
  return wav;
}

/** SRT captions from the narration. */
function srt(data, file) {
  const ts = (s) => new Date(s * 1000).toISOString().slice(11, 23).replace(".", ",");
  const lines = data.scenes.map((s, i) => `${i + 1}\n${ts(s.voStart)} --> ${ts(s.voStart + s.voDur + 0.3)}\n${s.vo.replace(/\*/g, "")}\n`);
  writeFileSync(file, lines.join("\n"));
}

const voice = await renderVoice();
const data = timeline(voice);
mkdirSync(OUT, { recursive: true });
const name = `md2slides-demo-${VERT ? "vertical" : "1080p"}${ONLY?.length ? "-" + ONLY.join("-") : ""}${DRAFT ? "-draft" : ""}`;
console.log(`timeline: ${data.scenes.length} scenes, ${data.total.toFixed(1)}s at ${FPS} fps`);
writeFileSync(join(CACHE, "timeline.json"), JSON.stringify(data, (k, v) => (k === "frames" ? undefined : v), 2));
const silent = join(CACHE, `${name}-video.mp4`);
const sfx = await frames(data, silent);
const wav = audio(data, voice, sfx, name);
const mp4 = join(OUT, `${name}.mp4`);
execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-i", silent, "-i", wav, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", mp4]);
srt(data, join(OUT, `${name}.srt`));
console.log("video:", mp4);
