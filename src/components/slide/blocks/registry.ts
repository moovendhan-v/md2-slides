import type { ComponentType } from "react";
import type { Block, BlockType } from "@/engine/types";
import { ChartBlock } from "./chart-block";
import { TableBlock, TerminalBlock } from "./code-blocks";
import { CodeOrDiagramBlock } from "./mermaid-block";
import { FlowBlock, TimelineBlock } from "./flow-blocks";
import { CardsBlock, ListBlock, StatsBlock } from "./list-blocks";
import { GalleryBlock, ImageBlock } from "./media-blocks";
import { CalloutBlock, HeadingBlock, ParaBlock, QuoteBlock } from "./text-blocks";

export type BlockComponent = ComponentType<{ block: Block }>;

/**
 * Open/closed: add a block type by registering a component here (and teaching
 * the Rust parser the syntax) — the slide renderer never switches on type.
 */
const registry = new Map<BlockType, BlockComponent>([
  ["heading", HeadingBlock],
  ["para", ParaBlock],
  ["list", ListBlock],
  ["stats", StatsBlock],
  ["cards", CardsBlock],
  ["flow", FlowBlock],
  ["timeline", TimelineBlock],
  ["terminal", TerminalBlock],
  ["code", CodeOrDiagramBlock],
  ["table", TableBlock],
  ["callout", CalloutBlock],
  ["chart", ChartBlock],
  ["gallery", GalleryBlock],
  ["image", ImageBlock],
  ["quote", QuoteBlock],
]);

export const registerBlock = (type: BlockType, c: BlockComponent) => registry.set(type, c);
export const blockComponent = (type: BlockType) => registry.get(type);
