"use client";

import { useEffect, useState } from "react";
import { useServices } from "@/app-shell/services";
import { Icon } from "@/components/common/icon";
import { Button } from "@/components/ui/button";

const SCOPES: [string, string, string][] = [
  ["user", "Your public profile", "text-green-400"],
  ["git-branch", "Read & write repositories (to open decks and push commits)", "text-green-400"],
  ["x-circle", "Nothing is stored on our servers — only an encrypted session cookie", "text-zinc-500"],
];

export function SignInPanel() {
  const { auth } = useServices();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const u = new URL(window.location.href);
    const err = u.searchParams.get("auth_error");
    if (err) {
      setError(err);
      u.searchParams.delete("auth_error");
      window.history.replaceState(null, "", u.pathname + u.search);
    }
  }, []);
  return (
    <div className="flex w-full max-w-[360px] flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-semibold tracking-tight">Welcome to Slidewise</h2>
        <p className="text-[13px] text-zinc-500">One click — your GitHub account is your Slidewise account.</p>
      </div>
      {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
      <Button
        className="h-11 gap-2 bg-zinc-50 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          auth.signIn();
        }}
      >
        <Icon name={busy ? "circle-notch" : "github-logo"} className={busy ? "animate-spin text-lg" : "text-lg"} />
        Continue with GitHub
      </Button>
      <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 p-4">
        <span className="text-xs font-semibold text-zinc-200">Slidewise will request</span>
        {SCOPES.map(([icon, label, color]) => (
          <span key={label} className="flex items-center gap-2 text-xs text-zinc-400">
            <Icon name={icon} className={color} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
