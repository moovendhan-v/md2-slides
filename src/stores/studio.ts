import { create } from "zustand";
import { CODE_TEMPLATES } from "@/data";

export type StudioTab = "html" | "config" | "sample" | "guide";

interface StudioState {
  id: string;
  html: string;
  config: string;
  sample: string;
  tab: StudioTab;
  mode: "dark" | "light";
  accent: string;
  set: (patch: Partial<Omit<StudioState, "set" | "loadExample" | "blank">>) => void;
  loadExample: (id: string) => void;
  blank: () => void;
}

const example = (id: string) => {
  const c = CODE_TEMPLATES.find((x) => x.id === id) ?? CODE_TEMPLATES[0];
  return { id: c.id, html: c.html, config: JSON.stringify({ id: c.id, ...c.config }, null, 2), sample: c.sample, tab: "html" as StudioTab };
};

const BLANK_HTML = `<div class="h-full flex flex-col justify-center gap-4 p-16">
  <span class="text-accent text-sm uppercase tracking-widest">{{kicker}}</span>
  <h1 class="font-head text-6xl font-bold">{{title}}</h1>
  <p class="text-muted text-xl">{{body}}</p>
</div>`;

/** Template studio working copy (HTML + config + sample Markdown). */
export const useStudio = create<StudioState>((set) => ({
  ...example(CODE_TEMPLATES[0]?.id ?? ""),
  mode: "dark",
  accent: "#60a5fa",
  set: (patch) => set(patch),
  loadExample: (id) => set(example(id)),
  blank: () =>
    set({
      id: "my-layout",
      html: BLANK_HTML,
      config: JSON.stringify({ id: "my-layout", name: "My layout", category: "Custom", author: "@you", slots: ["kicker", "title", "body"], description: "" }, null, 2),
      sample: "<!-- layout: custom:my-layout -->\n^ Hello\n# My first layout\nEdit template.html on the left.",
      tab: "html",
    }),
}));
