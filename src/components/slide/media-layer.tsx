"use client";

/* eslint-disable @next/next/no-img-element -- user-provided media */
import type { Look } from "@/domain/deck/look";
import type { MediaFrame } from "@/domain/deck/slide-frame";
import { Icon } from "@/components/common/icon";

/** Image area for media layouts (image-left, diagonal, circle, arch …). */
export function MediaLayer({ m, look, onPick }: { m: MediaFrame; look: Look; onPick?: () => void }) {
  const stripes = look.mode === "dark" ? look.bgSolid : "#e4e4e7";
  return (
    <>
      <div
        style={{
          position: "absolute", left: m.left, top: m.top, width: m.width, height: m.height, clipPath: m.clip, borderRadius: m.radius, overflow: "hidden",
          background: `repeating-linear-gradient(135deg,${look.panel} 0 1.2cqw,${stripes} 1.2cqw 2.4cqw)`,
        }}
      >
        {m.src ? (
          <img src={m.src} alt="" style={{ width: "100%", height: "100%", objectFit: m.fit as "cover", objectPosition: m.pos, filter: m.filter, transform: m.flip, display: "block" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: ".8cqw", color: look.muted, fontSize: "1.1cqw", textAlign: "center", padding: "2cqw" }}>
            <Icon name="image" style={{ fontSize: "3.6cqw" }} />
            <span style={{ fontFamily: look.mono }}>{m.alt}</span>
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, background: m.tint, mixBlendMode: "multiply", pointerEvents: "none" }} />
        {m.shade && <div style={{ position: "absolute", inset: 0, background: m.shade }} />}
        {onPick && (
          <div
            onClick={onPick}
            title="Click to set image & options"
            className="hover:bg-[rgba(96,165,250,.08)] hover:shadow-[inset_0_0_0_3px_rgba(96,165,250,.9)]"
            style={{ position: "absolute", inset: 0, cursor: "pointer", zIndex: 2 }}
          />
        )}
      </div>
      {m.stripe && <div style={{ position: "absolute", top: 0, bottom: 0, left: m.stripe.left, width: m.stripe.width, background: look.accent, clipPath: m.stripe.clip }} />}
    </>
  );
}
