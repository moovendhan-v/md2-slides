/* eslint-disable @next/next/no-img-element -- static slide renders */
import { SLIDE_TEXTURES } from "./slide-textures";

const STEPS = [
  { n: "1", title: "Write", md: "## Everything is a block\n\n:::cards style=glass cols=3\n- lightning | Live preview | …\n- squares-four | Components | …\n- share-network | Share links | …\n:::", img: SLIDE_TEXTURES[1] },
  { n: "2", title: "Diagram", md: "```mermaid\nflowchart LR\n  A[deck.md] --> B[Wasm engine]\n  B --> C[Slides]\n```", img: SLIDE_TEXTURES[3] },
  { n: "3", title: "Present", md: "```ts deck.ts {2|3}\nconst deck = await parse(\"deck.md\");\nconst link = await share(deck);\npresent(deck);\n```", img: SLIDE_TEXTURES[4] },
];

export function HowItWorks() {
  return (
    <section id="how" className="border-y border-zinc-900 bg-zinc-950 py-24">
      <div className="mx-auto max-w-6xl scroll-mt-20 px-5">
        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-zinc-50 md:text-4xl">Markdown on the left. Slides on the right.</h2>
        <div className="mt-12 flex flex-col gap-6">
          {STEPS.map((s) => (
            <div key={s.n} className="grid items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 md:grid-cols-[1fr_1.2fr] md:p-6">
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-200">
                  <span className="grid size-6 place-items-center rounded-full bg-blue-500/15 font-mono text-xs text-blue-300">{s.n}</span>
                  {s.title}
                </div>
                <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-[12.5px] leading-relaxed text-zinc-300">{s.md}</pre>
              </div>
              <img src={s.img} alt={`${s.title} step: rendered slide`} loading="lazy" className="w-full rounded-xl border border-zinc-800" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
