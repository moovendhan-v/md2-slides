"use client";

import { createContext, useContext } from "react";
import type { Block } from "@/engine/types";
import type { Look } from "@/domain/deck/look";

/** Interaction + presentation options shared by every block of one slide. */
export interface SlideRenderOptions {
  /** Editor mode: blocks are clickable and titles jump to source. */
  edit?: boolean;
  onPick?: (b: Block) => void;
  onJump?: (line: number) => void;
  onMedia?: (slideIndex: number) => void;
  selectedLine?: number;
  /** Play entrance animations; change `seed` to replay. */
  animate?: boolean;
  seed?: number;
  /** Click-to-reveal step while presenting (null = show all). */
  clicks?: number | null;
  codeStep?: number;
  prevCode?: Set<string>;
  /** Override custom HTML layouts (template studio live preview). */
  layouts?: Record<string, { html: string }>;
}

export interface BlockEnv {
  look: Look;
  opts: SlideRenderOptions;
}

const Ctx = createContext<BlockEnv | null>(null);

export const BlockEnvProvider = Ctx.Provider;

export function useBlockEnv(): BlockEnv {
  const v = useContext(Ctx);
  if (!v) throw new Error("useBlockEnv must be used inside <SlideView>");
  return v;
}
