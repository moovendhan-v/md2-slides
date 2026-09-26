/** Deck model produced by the Rust engine (`crates/slide-engine/src/model.rs`). */

export type Severity = "error" | "warn" | "info";

export interface Problem {
  line: number;
  sev: Severity;
  msg: string;
}

export type BlockArgs = Record<string, string> & { _title?: string; style?: string };

export type BlockType =
  | "heading"
  | "para"
  | "list"
  | "cards"
  | "stats"
  | "flow"
  | "timeline"
  | "terminal"
  | "chart"
  | "gallery"
  | "code"
  | "table"
  | "callout"
  | "quote"
  | "image";

export interface Block {
  type: BlockType;
  line: number;
  args?: BlockArgs;
  rows?: string[];
  text?: string;
  kind?: string;
  by?: string;
  alt?: string;
  src?: string;
  head?: string[];
  tableRows?: string[][];
  code?: string[];
  lang?: string;
  title?: string;
  hl?: number[];
  steps?: (number[] | null)[] | null;
  magic?: boolean;
  imported?: string;
  bare?: boolean;
  mermaid?: boolean;
}

export interface Slide {
  startLine: number;
  title: string;
  titleLine: number;
  kicker: string;
  body: string;
  groups: Block[][];
  notes: string;
  layout: string;
  dir: Record<string, string>;
  /** Set by the app when the slide was pulled in via `<!-- src: -->`. */
  imported?: string;
}

export interface Deck {
  meta: Record<string, string>;
  slides: Slide[];
  problems: Problem[];
}

export type FileResolver = (path: string) => string | undefined;

/** Template record stored in the Wasm `TemplateStore`. */
export interface TemplateRecord {
  id: string;
  name: string;
  cat: string;
  author: string;
  md: string;
  stars?: number;
  community?: boolean;
  single?: boolean;
  code?: boolean;
  look: Record<string, string | number | boolean>;
  html?: string;
  config?: CodeTemplateConfig;
}

export interface CodeTemplateConfig {
  id?: string;
  name: string;
  category: string;
  author: string;
  slots?: string[];
  description?: string;
}

export type TemplateSource = "builtin" | "single" | "community" | "all";

export interface TemplateFilter {
  source?: TemplateSource;
  category?: string;
  q?: string;
  page?: number;
  per?: number;
}

export interface TemplatePage {
  items: TemplateRecord[];
  total: number;
  page: number;
  pages: number;
}
