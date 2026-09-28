"use client";

import { Icon } from "@/components/common/icon";
import { ModelDownload } from "./ModelDownload";
import { useLocalAi } from "@/hooks/use-local-ai";

export function LocalAISettings() {
  const { isWebGpuSupported } = useLocalAi();

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-800/80 bg-zinc-950 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="cpu" className="text-violet-400" />
          <span className="font-semibold text-xs text-zinc-200">Local SLM Runtime Settings</span>
        </div>
        <span className="flex items-center gap-1 text-[11px] text-zinc-400">
          Backend:
          <strong className={isWebGpuSupported ? "text-emerald-400" : "text-amber-400"}>
            {isWebGpuSupported ? "WebGPU" : "WASM / CPU Fallback"}
          </strong>
        </span>
      </div>

      <ModelDownload />
    </div>
  );
}
