"use client";

import { useMemo } from "react";
import type { Slide } from "@/engine/types";
import type { Look } from "@/domain/deck/look";
import { customDocument, slideData } from "@/domain/deck/custom-layout";
import { useEngine } from "@/engine/provider";
import { useLayoutStore } from "@/stores/layouts";

/** Sandboxed iframe rendering a `custom:<id>` HTML + Tailwind layout. */
export function CustomLayout({ id, slide, look, overrides }: { id: string; slide: Slide; look: Look; overrides?: Record<string, { html: string }> }) {
  const engine = useEngine();
  const def = useLayoutStore((s) => overrides?.[id] ?? s.layouts[id]);
  const doc = useMemo(
    () => (def ? customDocument(def.html, slideData(slide), look, (html, data) => engine.fillTemplate(html, data)) : ""),
    [def, slide, look, engine],
  );
  if (!def) return null;
  return (
    <iframe
      srcDoc={doc}
      title="Custom layout"
      sandbox="allow-scripts"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, pointerEvents: "none", background: "transparent" }}
    />
  );
}
