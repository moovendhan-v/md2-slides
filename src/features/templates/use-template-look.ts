"use client";

import { useMemo } from "react";
import type { TemplateRecord } from "@/engine/types";
import { buildLook, deckOptions, thumbLook } from "@/domain/deck/look";
import { useEngine } from "@/engine/provider";

/** Template look fields use `palette`; front-matter uses `theme`. */
const toMeta = (look: TemplateRecord["look"]) =>
  Object.fromEntries(Object.entries(look ?? {}).map(([k, v]) => [k === "palette" ? "theme" : k, String(v)]));

/** Parsed slides + resolved look for rendering a template preview. */
export function useTemplateDeck(t: TemplateRecord | null) {
  const engine = useEngine();
  return useMemo(() => {
    if (!t) return null;
    const deck = engine.parse(t.md);
    const look = thumbLook(buildLook(deckOptions(toMeta(t.look))));
    return { deck, look };
  }, [t, engine]);
}
