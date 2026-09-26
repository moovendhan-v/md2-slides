"use client";

import { Seg, ToggleRow } from "@/components/common/controls";
import { Icon } from "@/components/common/icon";
import { Input } from "@/components/ui/input";
import { useByok, type AiProviderName } from "@/stores/byok";

const field = "h-8 border-zinc-800 font-mono text-xs";

/** Optional user-supplied AI keys, kept only in this tab's sessionStorage. */
export function ByokPanel() {
  const s = useByok();
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 p-3">
      <ToggleRow icon="key" label="Use my own API key" sub="Stored only in this browser tab (sessionStorage). Sent with each request, never saved on the server." checked={s.enabled} onChange={(enabled) => s.set({ enabled })} />
      {s.enabled && (
        <>
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            Try first
            <Seg<AiProviderName> size="sm" value={s.provider} onChange={(provider) => s.set({ provider })} options={[{ id: "gemini", label: "Gemini" }, { id: "cloudflare", label: "Cloudflare" }]} />
          </div>
          {s.provider === "gemini" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <Input type="password" autoComplete="off" placeholder="Gemini API key" value={s.gemini.apiKey} onChange={(e) => s.setGemini({ apiKey: e.target.value })} className={field} />
              <Input placeholder="Model (default gemini-2.5-flash)" value={s.gemini.model} onChange={(e) => s.setGemini({ model: e.target.value })} className={field} />
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-3">
              <Input autoComplete="off" placeholder="Account ID" value={s.cloudflare.accountId} onChange={(e) => s.setCloudflare({ accountId: e.target.value })} className={field} />
              <Input type="password" autoComplete="off" placeholder="API token" value={s.cloudflare.apiToken} onChange={(e) => s.setCloudflare({ apiToken: e.target.value })} className={field} />
              <Input placeholder="Model (@cf/…)" value={s.cloudflare.model} onChange={(e) => s.setCloudflare({ model: e.target.value })} className={field} />
            </div>
          )}
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Icon name="shield-check" /> If your key fails or is rate limited, the other provider is tried automatically.
            </span>
            <button type="button" onClick={s.clear} className="text-zinc-400 hover:text-red-400">
              Forget keys
            </button>
          </div>
        </>
      )}
    </div>
  );
}
