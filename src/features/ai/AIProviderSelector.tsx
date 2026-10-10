"use client";

import { Icon } from "@/components/common/icon";
import { cn } from "@/lib/utils";
import { useAi } from "@/stores/ai";
import { useLocalAi } from "@/hooks/use-local-ai";
import { ENABLE_LOCAL_AI } from "@/services/local-ai";

export function AIProviderSelector() {
  if (!ENABLE_LOCAL_AI) {
    return null;
  }
  return <AIProviderSelectorContent />;
}

function AIProviderSelectorContent() {
  const provider = useAi((s) => s.provider);
  const setAi = useAi((s) => s.set);
  const { isWebGpuSupported, status } = useLocalAi();

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setAi({ provider: "local" })}
          className={cn(
            "flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-all",
            provider === "local"
              ? "border-violet-500/80 bg-violet-950/30 text-zinc-100 shadow-sm shadow-violet-950/50"
              : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200",
          )}
        >
          <div className="flex w-full items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium text-xs text-zinc-200">
              <Icon name="cpu" className="text-violet-400" /> Local SLM
            </span>
            <span className="rounded bg-violet-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-violet-300">
              Browser WebGPU
            </span>
          </div>
          <p className="text-[11px] leading-tight text-zinc-400">
            Runs 100% privately in your browser. Zero server data transfer.
          </p>
          {isWebGpuSupported === false && (
            <span className="mt-1 flex items-center gap-1 text-[10px] text-amber-400">
              <Icon name="warning" /> WebGPU not supported
            </span>
          )}
          {status.state === "ready" && (
            <span className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400">
              <Icon name="check-circle" /> Model ready & cached
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setAi({ provider: "remote" })}
          className={cn(
            "flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-all",
            provider === "remote"
              ? "border-violet-500/80 bg-violet-950/30 text-zinc-100 shadow-sm shadow-violet-950/50"
              : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200",
          )}
        >
          <div className="flex w-full items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium text-xs text-zinc-200">
              <Icon name="cloud" className="text-blue-400" /> Remote AI
            </span>
            <span className="rounded bg-blue-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-300">
              Server API
            </span>
          </div>
          <p className="text-[11px] leading-tight text-zinc-400">
            Uses server-configured LLM endpoint for fast generation.
          </p>
        </button>
      </div>

      {provider === "local" && (
        <div className="flex items-center gap-1.5 rounded-md border border-emerald-900/40 bg-emerald-950/20 px-2.5 py-1.5 text-[11px] text-emerald-300/90">
          <Icon name="lock-key" className="shrink-0 text-emerald-400" />
          <span>Offline & Private: Markdown and prompts never leave this device.</span>
        </div>
      )}
    </div>
  );
}
