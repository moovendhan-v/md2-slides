import { markdownExporter, pdfExporter } from "./basic-exporters";
import { htmlExporter } from "./html-exporter";
import type { Exporter } from "./types";

/** Export formats in dialog order. Adding a format means adding one entry here. */
export const EXPORTERS: Exporter[] = [htmlExporter, pdfExporter, markdownExporter];
