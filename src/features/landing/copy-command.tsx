"use client";

import { useState } from "react";
import { Icon } from "@/components/common/icon";

/** A terminal command pill with a copy button. */
export function CopyCommand({ command, hint }: { command: string; hint?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-6 flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(command).then(() => (setCopied(true), setTimeout(() => setCopied(false), 1500)))}
        className="group flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2 font-mono text-[13px] text-zinc-200 hover:border-zinc-600"
        aria-label={`Copy command: ${command}`}
      >
        <span className="text-zinc-500">$</span> {command}
        <Icon name={copied ? "check" : "copy"} className={copied ? "text-green-400" : "text-zinc-500 group-hover:text-zinc-200"} />
      </button>
      {hint && <span className="text-xs text-zinc-500">{hint}</span>}
    </div>
  );
}
