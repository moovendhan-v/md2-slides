import fs from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

export const alt = `${BRAND.name}: ${BRAND.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social preview card (built once at build time). */
export default async function OpengraphImage() {
  const svg = await fs.readFile(path.join(process.cwd(), "public/logo.svg"), "utf8");
  const logo = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 88, background: "radial-gradient(circle at 80% 20%, #1e3a8a 0%, #09090b 55%)", color: "#fafafa" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <img src={logo} width={112} height={112} alt="" />
          <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: -2 }}>{BRAND.name}</div>
        </div>
        <div style={{ marginTop: 40, fontSize: 56, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1.1 }}>{BRAND.tagline}</div>
        <div style={{ marginTop: 24, fontSize: 28, color: "#a1a1aa" }}>Markdown decks · GitHub sync · share links · HTML export · VS Code</div>
      </div>
    ),
    size,
  );
}
