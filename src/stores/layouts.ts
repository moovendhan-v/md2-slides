import { create } from "zustand";
import { CODE_TEMPLATES, COMMUNITY_TEMPLATES } from "@/data";

/** Registry of custom HTML + Tailwind layouts, keyed by `custom:<id>`. */
export interface LayoutDef {
  html: string;
  config?: Record<string, unknown>;
}

interface LayoutState {
  layouts: Record<string, LayoutDef>;
  register: (id: string, def: LayoutDef) => void;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * Layouts by id, plus each layout's display name as a fallback id (`custom:category-hub` finds the
 * layout named "Category Hub" whose id is `hero-split-grid`). A real id always wins over a name.
 */
function withNameAliases(byId: Record<string, LayoutDef>): Record<string, LayoutDef> {
  const out = { ...byId };
  for (const def of Object.values(byId)) {
    const name = typeof def.config?.name === "string" ? slug(def.config.name) : "";
    if (name && !(name in out)) out[name] = def;
  }
  return out;
}

/** The registered layout ids closest to an unknown `id`, best first (for "did you mean"). */
export function suggestLayouts(id: string, layouts: Record<string, LayoutDef>, max = 3): string[] {
  const want = slug(id);
  const words = want.split("-").filter((w) => w.length > 2);
  return Object.entries(layouts)
    .filter(([key, def]) => typeof def.config?.id !== "string" || def.config.id === key)
    .map(([key, def]) => {
      const hay = `${key} ${slug(String(def.config?.name ?? ""))} ${slug(String(def.config?.category ?? ""))}`;
      return { key, score: words.filter((w) => hay.includes(w)).length };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((x) => x.key);
}

export const useLayoutStore = create<LayoutState>((set) => ({
  layouts: withNameAliases(
    Object.fromEntries([
      ...CODE_TEMPLATES.map((c) => [c.id, { html: c.html, config: c.config }]),
      // Community layouts (community/templates/<id>/template.html).
      ...COMMUNITY_TEMPLATES.flatMap((t) => (t.html && t.config?.id ? [[t.config.id, { html: t.html, config: { ...t.config } }]] : [])),
    ]),
  ),
  register: (id, def) => set((s) => ({ layouts: { ...s.layouts, [id]: def } })),
}));
