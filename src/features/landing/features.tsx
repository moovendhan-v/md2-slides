import { Icon } from "@/components/common/icon";

const FEATURES: [string, string, string][] = [
  ["git-branch", "GitHub is the database", "Open your repos, edit decks and push real commits or pull requests. No lock-in."],
  ["eye", "Live preview", "A Rust + WebAssembly engine re-renders every keystroke, with auto-split pages when a slide overflows."],
  ["squares-four", "Components view", "Every slide as cards you can drag. Moves rewrite the Markdown, so the file stays the source of truth."],
  ["flow-arrow", "Mermaid, charts, code", "Flowcharts, sequence and gantt diagrams, charts, and code that steps through line by line."],
  ["share-network", "Share without a server", "The deck travels inside the link, optionally password-encrypted. Nothing is uploaded."],
  ["file-html", "Export anywhere", "One offline HTML presentation with the full presenter, PDF, or plain Markdown."],
  ["presentation-chart", "A real presenter", "Speaker notes, timer, pen, laser, overview, click reveals and a synced speaker window."],
  ["sparkle", "AI drafts", "Describe a talk and get a first deck in md2slides Markdown, checked by the same parser."],
  ["code", "VS Code extension", "Open any .md as slides beside the editor, insert slides and blocks from live previews."],
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24">
      <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.03em] text-zinc-50 md:text-4xl">Everything a deck needs, nothing it doesn&apos;t.</h2>
      <p className="mt-3 max-w-xl text-[15px] text-zinc-400">Plain Markdown in, designed slides out. Built for engineers who live in Git.</p>
      <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-800 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(([icon, title, text]) => (
          <div key={title} className="flex flex-col gap-3 bg-zinc-950 p-6 transition-colors hover:bg-zinc-900/60">
            <span className="grid size-10 place-items-center rounded-lg border border-zinc-800 bg-zinc-900 text-lg text-blue-400">
              <Icon name={icon} />
            </span>
            <h3 className="text-[15px] font-semibold text-zinc-50">{title}</h3>
            <p className="text-[13px] leading-relaxed text-zinc-400">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
