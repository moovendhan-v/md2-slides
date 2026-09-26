import { Icon } from "@/components/common/icon";
import { BRAND } from "@/lib/brand";

export function VsCodeSection() {
  return (
    <section id="vscode" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24">
      <div className="grid items-center gap-10 rounded-3xl border border-zinc-800 bg-[radial-gradient(70%_80%_at_100%_0%,rgba(59,130,246,.16),transparent_60%)] p-8 md:grid-cols-2 md:p-12">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-blue-400">
            <Icon name="code" /> VS Code extension
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-zinc-50">Your editor, now a slide studio.</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-400">
            Open any Markdown deck as slides beside the text, insert slides, blocks and icons from live previews, and present without leaving VS Code.
          </p>
          <a href={`${BRAND.repo}/tree/main/vscode-extension`} className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm text-zinc-100 hover:border-zinc-500">
            <Icon name="download-simple" /> Get the extension
          </a>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-[12.5px] leading-relaxed">
          <div className="mb-3 flex gap-1.5">
            {["#f87171", "#fbbf24", "#4ade80"].map((c) => (
              <span key={c} className="size-2.5 rounded-full" style={{ background: c }} />
            ))}
          </div>
          <div className="text-zinc-500">{"// Command Palette"}</div>
          <div className="text-zinc-200">
            <span className="text-blue-400">md2slides:</span> Open as Slides <span className="text-zinc-600">⌘K ⇧S</span>
          </div>
          <div className="text-zinc-200">
            <span className="text-blue-400">md2slides:</span> Insert Slide…
          </div>
          <div className="text-zinc-200">
            <span className="text-blue-400">md2slides:</span> Present Slides
          </div>
        </div>
      </div>
    </section>
  );
}
