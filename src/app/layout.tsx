import type { Metadata, Viewport } from "next";
import "@phosphor-icons/web/regular";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slidewise — Markdown slide decks synced to GitHub",
  description: "Write Markdown, present like a designer. One .md file = one deck, versioned in Git.",
};

export const viewport: Viewport = { themeColor: "#09090b" };

const FONTS =
  "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Instrument+Serif&family=JetBrains+Mono:wght@400;500;700&display=swap";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
        <link rel="preload" href="/wasm/slide_engine_bg.wasm" as="fetch" type="application/wasm" crossOrigin="" />
      </head>
      <body className="bg-zinc-950 text-[13px] text-zinc-50 antialiased">{children}</body>
    </html>
  );
}
