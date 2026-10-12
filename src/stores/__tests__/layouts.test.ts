import { describe, expect, it } from "vitest";
import { suggestLayouts, useLayoutStore } from "../layouts";

describe("layout registry", () => {
  const layouts = useLayoutStore.getState().layouts;

  it("finds a community layout by its display name as well as its id", () => {
    expect(layouts["hero-split-grid"]).toBeDefined();
    expect(layouts["category-hub"]).toBe(layouts["hero-split-grid"]);
  });

  it("suggests real ids for an unknown layout", () => {
    expect(suggestLayouts("split-grid-hero", layouts)).toContain("hero-split-grid");
    expect(suggestLayouts("zzz", layouts)).toEqual([]);
  });
});
