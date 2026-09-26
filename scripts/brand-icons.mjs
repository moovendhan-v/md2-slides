#!/usr/bin/env node
/**
 * Render every icon size from public/logo.svg (run after changing the logo):
 *   src/app/icon.svg, src/app/favicon.ico (16/32/48), src/app/apple-icon.png (180),
 *   public/icon-192.png, public/icon-512.png, vscode-extension/media/icon.png (128)
 * Needs Playwright (npx playwright) — outputs are committed, so builds don't need it.
 */
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { root } from "./ui-bundle.mjs";

const require = createRequire(import.meta.url);
const { chromium } = (() => {
  for (const id of ["playwright", "/opt/node22/lib/node_modules/playwright"]) {
    try {
      return require(id);
    } catch {}
  }
  throw new Error("Playwright not found: npm i -D playwright");
})();

const svg = readFileSync(join(root, "public/logo.svg"), "utf8");
const browser = await chromium.launch();
const page = await browser.newPage();

async function png(size) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace("<svg ", `<svg width="${size}" height="${size}" `)}</body></html>`);
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}

/** ICO container holding PNG images (supported by every current browser). */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(data.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((x) => x.data)]);
}

copyFileSync(join(root, "public/logo.svg"), join(root, "src/app/icon.svg"));
const out = { "src/app/apple-icon.png": 180, "public/icon-192.png": 192, "public/icon-512.png": 512, "vscode-extension/media/icon.png": 128 };
for (const [file, size] of Object.entries(out)) writeFileSync(join(root, file), await png(size));
writeFileSync(join(root, "src/app/favicon.ico"), ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(size) })))));
await browser.close();
console.log("Brand icons written.");
