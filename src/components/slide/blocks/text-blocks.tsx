"use client";

import type { Block } from "@/engine/types";
import { Icon } from "@/components/common/icon";
import { hexA as tint } from "@/domain/deck/look";
import { RichText } from "../rich-text";
import { useBlockEnv } from "../render-context";

export function HeadingBlock({ block }: { block: Block }) {
  const { look } = useBlockEnv();
  return (
    <div style={{ fontSize: "2.1cqw", fontWeight: 600, letterSpacing: "-.01em", fontFamily: look.headFont }}>
      <RichText text={block.text} look={look} />
    </div>
  );
}

export function ParaBlock({ block }: { block: Block }) {
  const { look } = useBlockEnv();
  return (
    <div style={{ fontSize: look.bodySize, color: look.muted, lineHeight: 1.45 }}>
      <RichText text={block.text} look={look} />
    </div>
  );
}

const CALLOUT: Record<string, [string, string, string]> = {
  NOTE: ["#60a5fa", "info", "Note"],
  TIP: ["#4ade80", "lightbulb", "Tip"],
  WARNING: ["#fbbf24", "warning", "Warning"],
  DANGER: ["#f87171", "warning-octagon", "Danger"],
  SUCCESS: ["#34d399", "check-circle", "Success"],
};

export function CalloutBlock({ block }: { block: Block }) {
  const { look } = useBlockEnv();
  const [color, icon, label] = CALLOUT[block.kind ?? "NOTE"] ?? CALLOUT.NOTE;
  return (
    <div
      style={{
        display: "flex", gap: "1.4cqw", alignItems: "flex-start", padding: "1.8cqw 2.2cqw", borderRadius: look.r,
        background: tint(color, look.mode === "dark" ? 0.1 : 0.08), boxShadow: `inset 0 0 0 1px ${tint(color, 0.35)}`,
      }}
    >
      <Icon name={icon} style={{ fontSize: "2.3cqw", color, lineHeight: 1 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: ".4cqw" }}>
        <div style={{ fontSize: "1.15cqw", letterSpacing: ".14em", textTransform: "uppercase", color, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: "1.8cqw", lineHeight: 1.4 }}>
          <RichText text={block.text} look={look} />
        </div>
      </div>
    </div>
  );
}

export function QuoteBlock({ block }: { block: Block }) {
  const { look } = useBlockEnv();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.2cqw", maxWidth: "88%" }}>
      <div style={{ width: "5cqw", height: ".4cqw", background: look.accent }} />
      <div style={{ fontSize: "4.8cqw", lineHeight: 1.1, letterSpacing: "-.03em", fontWeight: 600, textWrap: "balance", fontFamily: look.headFont }}>
        <RichText text={block.text} look={look} />
      </div>
      <div style={{ fontSize: "1.8cqw", color: look.muted }}>{block.by}</div>
    </div>
  );
}
