import type { Look } from "@/domain/deck/look";

/** Footer, logo and slide counter drawn over every slide. */
export function SlideChrome({ look, index, total }: { look: Look; index: number; total: number }) {
  return (
    <>
      {look.footer && (
        <div style={{ position: "absolute", left: "6.4cqw", bottom: "3.2cqw", display: "flex", gap: "1.2cqw", alignItems: "center", fontSize: "1.2cqw", color: look.muted }}>
          <span style={{ width: "2.4cqw", height: ".2cqw", minHeight: 1, background: look.accent }} />
          <span>{look.footer}</span>
        </div>
      )}
      {look.logo && (
        <div style={{ position: "absolute", right: "4cqw", top: "3cqw", fontSize: "1.3cqw", fontWeight: 700, letterSpacing: ".02em", color: look.fg, opacity: 0.8, fontFamily: look.headFont }}>
          {look.logo}
        </div>
      )}
      {look.nums && (
        <div
          style={{
            position: "absolute", right: "4cqw", bottom: "2.8cqw", fontSize: "1.15cqw", color: look.muted, fontFamily: look.mono,
            padding: ".3cqw .9cqw", borderRadius: ".6cqw", boxShadow: `inset 0 0 0 1px ${look.rule}`,
          }}
        >
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </div>
      )}
    </>
  );
}
