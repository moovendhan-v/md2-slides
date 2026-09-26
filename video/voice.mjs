/**
 * Narration: renders each scene's line with the Piper neural TTS voice
 * (offline, `pip install piper-tts`) into .cache/vo/<scene>.wav and writes
 * .cache/vo/index.json with durations.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SCENES, VOICE } from "./storyboard.mjs";

const HERE = new URL(".", import.meta.url).pathname;
const CACHE = join(HERE, ".cache");
const OUT = join(CACHE, "vo");
const MODEL = join(CACHE, "voices", `${VOICE}.onnx`);

/** How words should be *said* (captions keep the written form). */
const SPOKEN = [
  [/md2slides/gi, "M D two slides"],
  [/\bnpx\b/g, "N P X"],
  [/\bMCP\b/g, "M C P"],
  [/\bVS Code\b/g, "V S Code"],
  [/\bGitHub\b/g, "Git Hub"],
];

export const spoken = (text) => SPOKEN.reduce((t, [re, s]) => t.replace(re, s), text);

/** Duration of a PCM WAV file in seconds. */
export function wavSeconds(file) {
  const b = readFileSync(file);
  const rate = b.readUInt32LE(24);
  const bytesPerSec = b.readUInt32LE(28);
  let off = 12;
  while (off < b.length - 8) {
    const id = b.toString("ascii", off, off + 4);
    const size = b.readUInt32LE(off + 4);
    if (id === "data") return size / bytesPerSec;
    off += 8 + size;
  }
  return (b.length - 44) / (rate * 2);
}

async function download() {
  if (existsSync(MODEL)) return;
  mkdirSync(join(CACHE, "voices"), { recursive: true });
  const [, speaker, quality] = VOICE.split("-");
  const base = `https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/${speaker}/${quality}/${VOICE}`;
  for (const ext of [".onnx", ".onnx.json"]) {
    console.log("voice: downloading", VOICE + ext);
    const res = await fetch(base + ext);
    if (!res.ok) throw new Error(`voice download failed: ${res.status}`);
    writeFileSync(MODEL.replace(/\.onnx$/, ext), Buffer.from(await res.arrayBuffer()));
  }
}

export async function renderVoice() {
  await download();
  mkdirSync(OUT, { recursive: true });
  const index = {};
  for (const s of SCENES) {
    const file = join(OUT, `${s.id}.wav`);
    const text = spoken(s.vo);
    const stamp = join(OUT, `${s.id}.txt`);
    // Re-render only lines that changed.
    if (!existsSync(file) || !existsSync(stamp) || readFileSync(stamp, "utf8") !== text + VOICE) {
      execFileSync("python3", ["-m", "piper", "-m", MODEL, "-f", file, "--length-scale", "0.97", "--sentence-silence", "0.25"], { input: text, stdio: ["pipe", "ignore", "inherit"] });
      writeFileSync(stamp, text + VOICE);
    }
    index[s.id] = { file, seconds: wavSeconds(file) };
    console.log(`voice: ${s.id.padEnd(11)} ${index[s.id].seconds.toFixed(2)}s`);
  }
  writeFileSync(join(OUT, "index.json"), JSON.stringify(index, null, 2));
  return index;
}

if (import.meta.url === `file://${process.argv[1]}`) await renderVoice();
