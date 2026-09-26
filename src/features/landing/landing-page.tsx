"use client";

import { Features } from "./features";
import { LandingFooter } from "./footer";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import { LandingNav } from "./nav";
import { useSignedIn } from "./use-signed-in";
import { VsCodeSection } from "./vscode-section";

/** The public landing page at `/` (the editor lives at `/app`). */
export function LandingPage() {
  const signedIn = useSignedIn();
  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-50">
      <LandingNav signedIn={signedIn} />
      <main>
        <Hero signedIn={signedIn} />
        <Features />
        <HowItWorks />
        <VsCodeSection />
      </main>
      <LandingFooter />
    </div>
  );
}
