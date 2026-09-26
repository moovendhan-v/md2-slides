import { COMMUNITY_TEMPLATES, SEED_TEMPLATES, codeTemplateRecords } from "@/data";
import type { TemplateRecord } from "@/engine/types";

/** Built-in catalog: Markdown deck/slide templates, HTML code layouts and community templates. */
export const builtinTemplates = (): TemplateRecord[] => [...SEED_TEMPLATES, ...codeTemplateRecords(), ...COMMUNITY_TEMPLATES];
