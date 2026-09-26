"use client";

import { Icon } from "@/components/common/icon";
import { Button } from "@/components/ui/button";
import { useSession } from "@/stores/session";

const SCOPES: [string, string, string][] = [
  ["user", "Your public profile and email", "text-green-400"],
  ["git-branch", "Read & write to repositories you select", "text-green-400"],
  ["x-circle", "No access to secrets, issues or actions", "text-zinc-500"],
];

export function SignInPanel() {
  const { mode, set } = useSession();
  const up = mode === "up";
  return (
    <div className="flex w-full max-w-[360px] flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-semibold tracking-tight">{up ? "Create your account" : "Welcome back"}</h2>
        <p className="text-[13px] text-zinc-500">{up ? "One click — your GitHub account is your Slidewise account." : "Sign in to pick up where you left off."}</p>
      </div>
      <Button className="h-11 gap-2 bg-zinc-50 text-sm font-semibold text-zinc-950 hover:bg-zinc-200" onClick={() => set({ status: "consent" })}>
        <Icon name="github-logo" className="text-lg" />
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
      <p className="text-center text-xs text-zinc-500">
        {up ? "Already have an account? " : "New to Slidewise? "}
        <button type="button" className="text-blue-400 underline underline-offset-2 hover:text-blue-300" onClick={() => set({ mode: up ? "in" : "up" })}>
          {up ? "Sign in" : "Sign up with GitHub"}
        </button>
      </p>
    </div>
  );
}
