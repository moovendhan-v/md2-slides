import type { IconInfo } from "./search";

let catalog: Promise<IconInfo[]> | null = null;

/** Phosphor's icon catalog (names, categories, search tags), loaded on first use. */
export function loadIconCatalog(): Promise<IconInfo[]> {
  catalog ??= import("@phosphor-icons/core").then(({ icons }) =>
    icons.map((i) => ({ name: i.name, categories: i.categories, tags: i.tags.filter((t) => !t.startsWith("*")) })),
  );
  return catalog;
}

export const ICON_CATEGORIES = [
  "arrows",
  "communications",
  "technology & development",
  "office",
  "editor",
  "media",
  "design",
  "people",
  "finances",
  "commerce",
  "maps & travel",
  "objects",
  "system",
  "health & wellness",
  "nature",
  "weather",
  "games",
  "brands",
] as const;
