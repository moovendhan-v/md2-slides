import Link from "next/link";
import { Icon } from "@/components/common/icon";
import { HERO } from "./content";
import { CopyCommand } from "./copy-command";
import { DEMO_DECK_HASH } from "./demo-link";
import { LiveDemo } from "./live-demo";

export function Hero({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(50%_60%_at_50%_0%,rgba(59,130,246,.22),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(60%_50%_at_50%_0%,black,transparent)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-5 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/70 px-3 py-1 text-xs text-zinc-400">
          <span className="size-1.5 rounded-full bg-blue-500" /> {HERO.badge}
        </span>
        <h1 className="mt-6 text-[clamp(2.4rem,6.4vw,4.8rem)] leading-[0.98] font-semibold tracking-[-0.045em] text-balance text-zinc-50">
          {HERO.title[0]} <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">{HERO.title[1]}</span>
        </h1>
        <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-zinc-400">{HERO.sub}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/app" className="flex h-11 items-center gap-2 rounded-lg bg-zinc-50 px-5 text-sm font-semibold text-zinc-950 hover:bg-zinc-200">
            <Icon name={signedIn ? "folder-open" : "github-logo"} /> {signedIn ? "Open your decks" : "Start with GitHub"}
          </Link>
          <a href={`/v#${DEMO_DECK_HASH}`} className="flex h-11 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 px-5 text-sm font-medium text-zinc-200 hover:border-zinc-600">
            <Icon name="play" /> View a demo deck
          </a>
        </div>
        <CopyCommand command="npx -y md2slides-mcp" hint="Let Claude write decks into your repo" />
      </div>
      <div className="relative mx-auto mt-14 max-w-6xl px-5">
        <LiveDemo />
        <p className="mt-3 text-center text-xs text-zinc-500">Not a video: the real md2slides engine re-renders the slide on every keystroke.</p>
      </div>
    </section>
  );
}
