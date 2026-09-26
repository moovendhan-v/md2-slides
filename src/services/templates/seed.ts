import { SEED_TEMPLATES, codeTemplateRecords } from "@/data";
import type { TemplateRecord } from "@/engine/types";

/** Built-in catalog: Markdown deck/slide templates + HTML code layouts. */
export const builtinTemplates = (): TemplateRecord[] => [...SEED_TEMPLATES, ...codeTemplateRecords()];
