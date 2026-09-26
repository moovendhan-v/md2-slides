"use client";

import { useCallback, useEffect, useState } from "react";
import { BootScreen } from "@/components/shell/boot-screen";
import { Icon } from "@/components/common/icon";
import { TooltipProvider } from "@/components/ui/tooltip";
import { decodeShare, needsPassword, ShareDecodeError } from "@/domain/share/codec";
import { isExpired, type SharePayload } from "@/domain/share/payload";
import { EngineProvider } from "@/engine/provider";
import { Player } from "@/player/player";

type State = { kind: "loading" } | { kind: "password"; error?: string } | { kind: "error"; message: string } | { kind: "ready"; payload: SharePayload };

function Message({ icon, title, children }: { icon: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-zinc-950 p-6 text-zinc-50">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <span className="grid size-12 place-items-center rounded-xl bg-zinc-900 text-2xl text-zinc-400">
          <Icon name={icon} />
        </span>
        <h1 className="text-lg font-semibold">{title}</h1>
        {children}
      </div>
    </div>
  );
}

/** Decodes `#<payload>` (asking for the password when needed) and mounts the read-only player. */
export function ShareViewer() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [pw, setPw] = useState("");

  const open = useCallback(async (password?: string) => {
    const encoded = location.hash.slice(1);
    if (!encoded) return setState({ kind: "error", message: "This link has no deck in it. Ask for a new share link." });
    if (needsPassword(encoded) && !password) return setState({ kind: "password" });
    try {
      const payload = await decodeShare(encoded, password);
      if (isExpired(payload)) return setState({ kind: "error", message: `This link expired on ${new Date(payload.expires!).toLocaleString()}. Ask the author for a new one.` });
      setState({ kind: "ready", payload });
    } catch (e) {
      if (e instanceof ShareDecodeError && e.reason === "password") return setState({ kind: "password", error: password ? e.message : undefined });
      setState({ kind: "error", message: (e as Error).message });
    }
  }, []);

  useEffect(() => {
    void open();
    const onHash = () => void open();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [open]);

  if (state.kind === "loading") return <BootScreen label="Opening shared deck…" />;
  if (state.kind === "error")
    return (
      <Message icon="link-break" title="Can't open this deck">
        <p className="text-sm text-zinc-400">{state.message}</p>
      </Message>
    );
  if (state.kind === "password")
    return (
      <Message icon="lock-simple" title="Password protected deck">
        <form
          className="flex w-full flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void open(pw);
          }}
        >
          <input
            autoFocus
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Password"
            aria-label="Password"
            className="h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm outline-none focus:border-zinc-600"
          />
          {state.error && <p className="text-xs text-red-400">{state.error}</p>}
          <button type="submit" className="h-10 rounded-md bg-zinc-50 text-sm font-semibold text-zinc-950 hover:bg-zinc-200">
            Open deck
          </button>
          <p className="text-xs text-zinc-500">The deck is decrypted in your browser.</p>
        </form>
      </Message>
    );
  const speaker = new URLSearchParams(location.search).get("speaker") === "1";
  return (
    <TooltipProvider delayDuration={300}>
      <EngineProvider fallback={<BootScreen label="Loading slide engine…" />}>
        <Player payload={state.payload} speaker={speaker} />
      </EngineProvider>
    </TooltipProvider>
  );
}
