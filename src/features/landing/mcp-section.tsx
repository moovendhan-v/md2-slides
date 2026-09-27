"use client";

import { useState } from "react";
import { Icon } from "@/components/common/icon";
import { cn } from "@/lib/utils";
import { MCP } from "./content";
import { SectionHead } from "./section-head";

export function McpSection() {
  const clients = Object.keys(MCP.install);
  const [tab, setTab] = useState(clients[0]);
  const [copied, setCopied] = useState(false);
  const code = MCP.install[tab];
  return (
    <section id="mcp" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24">
      <div className="grid items-start gap-10 md:grid-cols-2">
        <div>
          <SectionHead kicker="MCP server · npx" title={MCP.title} sub={MCP.sub} />
          <ol className="mt-8 flex flex-col gap-3">
            {MCP.steps.map(([icon, label], i) => (
              <li key={label} className="flex items-center gap-3 text-[14px] text-zinc-300">
                <span className="grid size-8 place-items-center rounded-lg border border-zinc-800 bg-zinc-900 text-blue-400">
                  <Icon name={icon} />
                </span>
                <span className="font-mono text-xs text-zinc-600">{i + 1}</span> {label}
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
            <div className="flex border-b border-zinc-800" role="tablist" aria-label="MCP client">
              {clients.map((c) => (
                <button key={c} type="button" role="tab" aria-selected={c === tab} onClick={() => setTab(c)} className={cn("px-4 py-2.5 text-xs", c === tab ? "border-b-2 border-blue-500 text-zinc-50" : "text-zinc-500 hover:text-zinc-200")}>
                  {c}
                </button>
              ))}
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(code).then(() => (setCopied(true), setTimeout(() => setCopied(false), 1500)))}
                className="ml-auto px-4 text-xs text-zinc-500 hover:text-zinc-200"
              >
                <Icon name={copied ? "check" : "copy"} /> {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-zinc-200" role="tabpanel">
              {code}
            </pre>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Icon name="sparkle" className="text-violet-400" /> Then ask Claude
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-zinc-200">“{MCP.prompt}”</p>
            <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-[12px] text-zinc-400">
              <span className="text-green-400">✓</span> create_deck decks/acme-q3.md · 6 slides · 0 problems
              <br />
              <span className="text-blue-400">→</span> preview: md2slides.cybertechmind.com/v#AQBVj1F…
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
