"use client";

import { Icon } from "@/components/common/icon";
import { useAiHealthQuery } from "@/hooks/use-queries";
import { cn } from "@/lib/utils";

/** Live status of the server's AI endpoint (ping check), with a re-check button. */
export function AiStatus({ enabled = true }: { enabled?: boolean }) {
  const q = useAiHealthQuery(enabled);
  const h = q.data;
  const checking = q.isFetching;
  const tone = checking || !h ? "checking" : !h.configured || !h.ok ? "down" : h.modelListed === false ? "warn" : "up";
  const text = checking
    ? "Checking AI connection…"
    : !h
      ? "AI status unknown"
      : !h.configured
        ? "AI is not configured on the server"
        : !h.ok
          ? `${h.provider ?? "AI"} is not responding${h.status ? ` (${h.status})` : ""}: ${h.error ?? "unknown error"}`
          : `${h.provider} · ${h.model} · reachable in ${h.latencyMs} ms${h.modelListed === false ? " — model not in the provider's model list" : ""}`;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs" role="status" aria-live="polite">
      <span
        className={cn(
          "size-2 shrink-0 rounded-full",
          tone === "up" && "bg-green-400",
          tone === "warn" && "bg-amber-400",
          tone === "down" && "bg-red-400",
          tone === "checking" && "animate-pulse bg-zinc-500",
        )}
      />
      <span className={cn("min-w-0 flex-1 truncate", tone === "down" ? "text-red-300" : "text-zinc-400")} title={text}>
        {text}
      </span>
      <button type="button" onClick={() => q.refetch()} disabled={checking} className="flex items-center gap-1 text-zinc-500 hover:text-zinc-200 disabled:opacity-50">
        <Icon name="arrows-clockwise" className={checking ? "animate-spin" : ""} /> Check
      </button>
    </div>
  );
}
