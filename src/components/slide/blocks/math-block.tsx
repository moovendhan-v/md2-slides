"use client";

import { useEffect, useRef, useState } from "react";
import type { Block } from "@/engine/types";
import { useBlockEnv } from "../render-context";

// KaTeX version pinned for reproducibility.
const KATEX_VERSION = "0.16.11";
const KATEX_CSS = `https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist/katex.min.css`;
const KATEX_JS = `https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist/katex.min.js`;

type KaTeXAPI = {
  renderToString(expr: string, opts: { displayMode: boolean; throwOnError: boolean; output: string }): string;
};

let katexPromise: Promise<KaTeXAPI> | null = null;

function loadKaTeX(): Promise<KaTeXAPI> {
  if (katexPromise) return katexPromise;
  katexPromise = new Promise((resolve, reject) => {
    // Inject CSS once
    if (!document.getElementById("katex-css")) {
      const link = document.createElement("link");
      link.id = "katex-css";
      link.rel = "stylesheet";
      link.href = KATEX_CSS;
      document.head.appendChild(link);
    }
    // KaTeX JS already loaded (window.katex)
    if ((window as unknown as Record<string, unknown>).katex) {
      resolve((window as unknown as Record<string, KaTeXAPI>).katex);
      return;
    }
    const script = document.createElement("script");
    script.src = KATEX_JS;
    script.onload = () => resolve((window as unknown as Record<string, KaTeXAPI>).katex);
    script.onerror = () => reject(new Error("Failed to load KaTeX"));
    document.head.appendChild(script);
  });
  return katexPromise;
}

/** Renders a :::math block — block-display LaTeX via KaTeX. */
export function MathBlock({ block }: { block: Block }) {
  const { look } = useBlockEnv();
  const latex = (block.text ?? block.rows?.join("\n") ?? "").trim();
  const displayMode = (block.args?.style ?? "block") !== "inline";
  const [html, setHtml] = useState<string>("");
  const [error, setError] = useState<string>("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!latex) return;
    setError("");
    loadKaTeX()
      .then((katex) => {
        try {
          const out = katex.renderToString(latex, {
            displayMode,
            throwOnError: true,
            output: "html",
          });
          setHtml(out);
        } catch (e) {
          setError(String(e).replace(/^.*?:/, "").trim());
        }
      })
      .catch((e: Error) => setError(e.message));
  }, [latex, displayMode]);

  if (error) {
    return (
      <div
        style={{
          padding: "1.8cqw 2.2cqw",
          borderRadius: look.r,
          background: "rgba(248,113,113,.08)",
          boxShadow: "inset 0 0 0 1px rgba(248,113,113,.3)",
          fontFamily: look.mono,
          fontSize: "1.3cqw",
          color: "#f87171",
        }}
      >
        ⚠ LaTeX error: {error}
      </div>
    );
  }

  if (!html) {
    return (
      <div style={{ height: "6cqw", display: "grid", placeItems: "center", color: look.muted, fontSize: "1.3cqw" }}>
        Rendering math…
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="m2s-math"
      style={{
        display: "flex",
        justifyContent: "center",
        padding: displayMode ? "1.5cqw 0" : "0",
        fontSize: displayMode ? "2.4cqw" : "inherit",
        color: look.fg,
        overflowX: "auto",
      }}
      // KaTeX output is sanitized server-side; no scripts.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
