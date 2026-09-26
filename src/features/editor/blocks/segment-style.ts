import type { SegmentKind } from "@/domain/source/outline";

export interface SegmentStyle {
  name: string;
  icon: string;
  /** Tailwind classes for the chip and the card's accent edge. */
  chip: string;
  edge: string;
}

const S = (name: string, icon: string, chip: string, edge: string): SegmentStyle => ({ name, icon, chip, edge });

/** One colour family per component kind, matching the editor's syntax colours. */
export const SEGMENT_STYLE: Record<SegmentKind, SegmentStyle> = {
  heading: S("Heading", "text-h", "border-indigo-500/40 bg-indigo-500/10 text-indigo-300", "border-l-indigo-400/70"),
  kicker: S("Kicker", "tag", "border-amber-500/40 bg-amber-500/10 text-amber-300", "border-l-amber-400/70"),
  para: S("Text", "text-align-left", "border-zinc-600/50 bg-zinc-800/60 text-zinc-300", "border-l-zinc-500/70"),
  list: S("List", "list-bullets", "border-blue-500/40 bg-blue-500/10 text-blue-300", "border-l-blue-400/70"),
  code: S("Code", "code", "border-purple-500/40 bg-purple-500/10 text-purple-300", "border-l-purple-400/70"),
  fence: S("Block", "squares-four", "border-emerald-500/40 bg-emerald-500/10 text-emerald-300", "border-l-emerald-400/70"),
  table: S("Table", "table", "border-teal-500/40 bg-teal-500/10 text-teal-300", "border-l-teal-400/70"),
  quote: S("Quote", "quotes", "border-cyan-500/40 bg-cyan-500/10 text-cyan-300", "border-l-cyan-400/70"),
  callout: S("Callout", "warning-circle", "border-yellow-500/40 bg-yellow-500/10 text-yellow-300", "border-l-yellow-400/70"),
  image: S("Image", "image", "border-pink-500/40 bg-pink-500/10 text-pink-300", "border-l-pink-400/70"),
  columns: S("Column break", "columns", "border-zinc-600/50 bg-zinc-800/60 text-zinc-400", "border-l-zinc-500/70"),
  directive: S("Directive", "sliders-horizontal", "border-orange-500/40 bg-orange-500/10 text-orange-300", "border-l-orange-400/70"),
  comment: S("Comment", "chat-text", "border-zinc-700 bg-zinc-900 text-zinc-500", "border-l-zinc-600/70"),
  notes: S("Speaker notes", "microphone", "border-rose-500/40 bg-rose-500/10 text-rose-300", "border-l-rose-400/70"),
};
