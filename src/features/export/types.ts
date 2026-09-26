import type { ActiveDeck } from "@/app-shell/deck-context";

/** Options shown in the export dialog (each format reads the ones it supports). */
export interface ExportOptions {
  notes: boolean;
  download: boolean;
  present: boolean;
  password: string;
}

export interface ExportContext {
  deck: ActiveDeck;
  options: ExportOptions;
  /** Base name for the file, without extension. */
  name: string;
}

/**
 * One export format. `run` returns the file to download, or nothing when the
 * format hands off to the browser itself (print to PDF).
 */
export interface Exporter {
  id: string;
  label: string;
  icon: string;
  description: string;
  /** Option keys this format uses (the dialog shows only these). */
  uses: (keyof ExportOptions)[];
  run(ctx: ExportContext): Promise<{ blob: Blob; filename: string } | void>;
}
