import { create } from "zustand";

/** Transient UI state of the Blocks view: drag and drop, and what is being edited. */
export type DragItem = { type: "slide"; slide: number } | { type: "segment"; slide: number; seg: number };
export interface DropTarget {
  slide: number;
  /** Segment index to insert before; undefined targets the slide itself. */
  at?: number;
  /** For slide drops: insert before (true) or after this slide. */
  before?: boolean;
}

interface BlocksState {
  item: DragItem | null;
  over: DropTarget | null;
  /** Component open in its raw editor, as `slide:seg`. */
  editing: string | null;
  /** Slides shown as one raw Markdown box. */
  raw: Record<number, boolean>;
  set: (patch: Partial<Omit<BlocksState, "set">>) => void;
}

export const useBlocksState = create<BlocksState>((set) => ({ item: null, over: null, editing: null, raw: {}, set: (patch) => set(patch) }));

/** True when the pointer is in the upper half of the element under it. */
export const upperHalf = (e: React.DragEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  return e.clientY < r.top + r.height / 2;
};

/** Final index for moving slide `from` before/after slide `i`. */
export const slideDest = (from: number, i: number, before: boolean) => {
  const to = before ? i : i + 1;
  return from < to ? to - 1 : to;
};
