"use client";

import { BrandMark } from "@/components/shell/app-header";
import { SignInPanel } from "./sign-in-panel";

/** Split-screen GitHub sign-in: hero on the left, sign-in on the right. */
export function AuthScreen() {
  return (
    <div className="grid min-h-dvh bg-zinc-950 md:grid-cols-2">
      <section
        className="relative hidden flex-col justify-between border-r border-zinc-800 p-10 md:flex"
        style={{ background: "radial-gradient(60% 50% at 20% 10%, rgba(59,130,246,.14), transparent 70%), radial-gradient(50% 40% at 90% 100%, rgba(139,92,246,.12), transparent 70%), #09090b" }}
      >
        <div className="flex items-center gap-2 text-[13px] font-semibold">
          <BrandMark />
          Slidewise
        </div>
        <div className="flex max-w-md flex-col gap-4">
          <h1 className="text-[44px] leading-[1.02] font-semibold tracking-[-0.035em] text-balance">Your decks are Markdown. Your history is Git.</h1>
          <p className="text-[15px] leading-relaxed text-zinc-400">Sign in with GitHub to open repositories, edit slides and push changes as commits.</p>
        </div>
        <p className="text-xs text-zinc-600">Your GitHub token stays in an encrypted, http-only cookie and is only used server-side.</p>
      </section>
      <section className="flex items-center justify-center p-6">
        <SignInPanel />
      </section>
    </div>
  );
}
