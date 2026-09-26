import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** The md2slides mark, optionally with the wordmark. */
export function Logo({ size = 28, wordmark = false, className }: { size?: number; wordmark?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {/* A static SVG from /public: nothing for next/image to optimise. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BRAND.logo} width={size} height={size} alt={wordmark ? "" : BRAND.name} className="shrink-0" />
      {wordmark && <span className="font-semibold tracking-tight text-zinc-50">{BRAND.name}</span>}
    </span>
  );
}
