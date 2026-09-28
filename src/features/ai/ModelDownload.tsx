"use client";

import { useState } from "react";
import { Icon } from "@/components/common/icon";
import { Button } from "@/components/ui/button";
import { useLocalAi } from "@/hooks/use-local-ai";
import { cn } from "@/lib/utils";

export function ModelDownload() {
  const {
    status,
    models,
    activeModel,
    cachedModels,
    isWebGpuSupported,
    loadModel,
    deleteModel,
    setLocalModelId,
  } = useLocalAi();

  const [loadingModel, setLoadingModel] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);

  const isModelReady = status.state === "ready" && status.modelId === activeModel.id;
  const isDownloading = status.state === "downloading" || status.state === "loading" || loadingModel;
  const isCached = cachedModels[activeModel.id] || false;

  const handleDownload = async () => {
    try {
      setLoadingModel(true);
      await loadModel(activeModel.id);
    } catch {
      // Error is caught in state
    } finally {
      setLoadingModel(false);
    }
  };

  const handleDeleteCache = async () => {
    await deleteModel(activeModel.id);
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="cube" className="text-violet-400" />
          <span className="font-medium text-zinc-200">{activeModel.name}</span>
          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
            {activeModel.parameters} · ~{activeModel.downloadSizeMB} MB
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowModelPicker((v) => !v)}
          className="text-[11px] text-violet-400 hover:text-violet-300"
        >
          {showModelPicker ? "Hide models" : "Change model"}
        </button>
      </div>

      {showModelPicker && (
        <div className="flex flex-col gap-2 rounded-md border border-zinc-800/80 bg-zinc-950/60 p-2">
          <p className="text-[11px] font-medium text-zinc-400">Select Small Language Model (SLM):</p>
          <div className="flex flex-col gap-1.5">
            {models.map((m) => {
              const selected = m.id === activeModel.id;
              const cached = cachedModels[m.id];
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setLocalModelId(m.id);
                    setShowModelPicker(false);
                  }}
                  className={cn(
                    "flex items-center justify-between rounded p-2 text-left transition-colors text-[11px]",
                    selected ? "bg-violet-950/50 text-violet-200 border border-violet-800/60" : "hover:bg-zinc-800/50 text-zinc-300",
                  )}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {m.name} {m.recommended && <span className="text-[10px] text-emerald-400">(Recommended)</span>}
                    </span>
                    <span className="text-[10px] text-zinc-400">{m.description}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-zinc-500">~{m.downloadSizeMB} MB</span>
                    {cached && <span className="text-[10px] text-emerald-400">✓ Cached</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isDownloading ? (
        <div className="flex flex-col gap-2 rounded bg-zinc-950/40 p-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-violet-300">
              <Icon name="circle-notch" className="animate-spin" />
              {status.progressText || "Downloading and initializing model weights..."}
            </span>
            <span className="font-mono text-zinc-400">
              {status.progress ? `${Math.round(status.progress * 100)}%` : ""}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full bg-violet-500 transition-all duration-300 ease-out"
              style={{ width: `${Math.max(5, (status.progress || 0) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-500">
            Model weights are stored securely in your browser&apos;s persistent cache.
          </p>
        </div>
      ) : isModelReady ? (
        <div className="flex items-center justify-between rounded bg-emerald-950/20 px-2.5 py-1.5 border border-emerald-900/30">
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-300">
            <Icon name="check-circle" /> Model ready for offline inference
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[10px] text-zinc-400 hover:text-red-400"
            onClick={handleDeleteCache}
          >
            Clear cache
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-zinc-400">
            {isCached
              ? "Weights cached locally. Click load to start in-memory session."
              : `Download (~${activeModel.downloadSizeMB} MB) once to run entirely offline.`}
          </p>
          <Button
            size="sm"
            onClick={handleDownload}
            disabled={isWebGpuSupported === false}
            className="h-7 shrink-0 gap-1 bg-violet-600 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50"
          >
            <Icon name={isCached ? "play" : "download-simple"} />
            {isCached ? "Load Model" : "Download Model"}
          </Button>
        </div>
      )}

      {status.error && (
        <p className="rounded bg-red-950/30 p-2 text-[11px] text-red-300 border border-red-900/40">
          {status.error}
        </p>
      )}
    </div>
  );
}
