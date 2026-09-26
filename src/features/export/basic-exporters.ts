import { useUi } from "@/stores/ui";
import type { Exporter } from "./types";

export const markdownExporter: Exporter = {
  id: "md",
  label: "Markdown",
  icon: "file-md",
  description: "The deck source as a .md file.",
  uses: [],
  async run({ deck, name }) {
    return { blob: new Blob([deck.src], { type: "text/markdown" }), filename: `${name}.md` };
  },
};

/** Browser print (one slide per page) via the off-screen print root. */
export async function printSlides() {
  useUi.getState().set({ printing: true, modal: null });
  await new Promise((r) => setTimeout(r, 700));
  window.print();
  setTimeout(() => useUi.getState().set({ printing: false }), 400);
}

export const pdfExporter: Exporter = {
  id: "pdf",
  label: "PDF",
  icon: "file-pdf",
  description: "Print to PDF, one slide per page (uses the browser's print dialog).",
  uses: [],
  run: printSlides,
};
