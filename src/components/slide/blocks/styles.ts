import type { CSSProperties } from "react";
import type { CardSurface } from "@/domain/deck/look";

/** Shared style fragments so block components don't repeat surface rules. */
export const surface = (c: CardSurface, extra?: CSSProperties): CSSProperties => ({
  background: c.bg,
  boxShadow: c.ring,
  backdropFilter: c.blur,
  ...extra,
});

export const ellipsis: CSSProperties = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" };

export const mono = (font: string, extra?: CSSProperties): CSSProperties => ({ fontFamily: font, ...extra });
