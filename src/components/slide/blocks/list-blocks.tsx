"use client";

import type { Block } from "@/engine/types";
import { Icon } from "@/components/common/icon";
import { listText, rowCells } from "@/domain/deck/rows";
import { RichText } from "../rich-text";
import { useBlockEnv } from "../render-context";
import { surface } from "./styles";

export function ListBlock({ block }: { block: Block }) {
  const { look } = useBlockEnv();
  const style = block.args?.style || "dot";
  const boxed = style === "boxed";
  const isCheck = style === "check";
  const rows = block.rows ?? [];
  return (
    <div style={{ display: "grid", gridTemplateColumns: boxed && rows.length > 3 ? "repeat(2,minmax(0,1fr))" : "1fr", gap: boxed ? "1.2cqw" : `${1.3 * look.sp}cqw` }}>
      {rows.map((r, k) => {
        const done = /^[-*]\s+\[x\]/i.test(r);
        const chk = /^[-*]\s+\[[ x]\]/i.test(r);
        const on = isCheck && (!chk || done);
        const text = listText(r);
        return (
          <div
            key={k}
            style={{
              display: "flex", gap: "1.4cqw", alignItems: "center", fontSize: look.bulletSize, lineHeight: 1.35, borderRadius: look.r,
              ...(boxed ? surface(look.card, { padding: "1.4cqw 1.8cqw" }) : {}),
            }}
          >
            {(style === "dot" || boxed) && (
              <span style={{ width: ".8cqw", height: ".8cqw", borderRadius: "50%", background: look.accent, flex: "none", transform: "translateY(-.25cqw)" }} />
            )}
            {(isCheck || style === "number") && (
              <span
                style={{
                  flex: "none", minWidth: "2.8cqw", height: "2.8cqw", borderRadius: ".7cqw", display: "grid", placeItems: "center",
                  fontSize: "1.35cqw", fontWeight: 600, fontFamily: look.mono,
                  background: isCheck ? (on ? look.accent : "transparent") : look.chip,
                  color: isCheck ? look.bgSolid : look.accent,
                  boxShadow: isCheck && !on ? `inset 0 0 0 .15cqw ${look.muted}` : "none",
                }}
              >
                {isCheck ? (on ? "✓" : "") : k + 1}
              </span>
            )}
            <span style={{ color: isCheck && chk && !done ? look.muted : look.fg }}>
              <RichText text={text} look={look} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function StatsBlock({ block }: { block: Block }) {
  const { look } = useBlockEnv();
  const style = block.args?.style || "boxed";
  const boxed = style !== "plain";
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "2cqw" }}>
      {(block.rows ?? []).map((r, i) => {
        const [v, l, d] = rowCells(r);
        return (
          <div
            key={i}
            style={{
              flex: "1 1 0", minWidth: "20%", display: "flex", flexDirection: "column", gap: ".8cqw", borderRadius: look.r,
              padding: boxed ? "2.4cqw" : 0, ...(boxed ? surface(look.card) : {}),
            }}
          >
            {style === "bar" && <div style={{ width: "4cqw", height: ".35cqw", borderRadius: "1cqw", background: look.accent, marginBottom: ".6cqw" }} />}
            <div
              style={{
                fontSize: style === "big" ? "7cqw" : "5.2cqw", letterSpacing: "-.04em", fontWeight: 700, lineHeight: 1,
                color: style === "big" ? look.accent : look.fg, fontFamily: look.headFont,
              }}
            >
              {v}
            </div>
            <div style={{ fontSize: "1.6cqw", color: look.muted }}>{l}</div>
            {d && (
              <div style={{ alignSelf: "flex-start", fontSize: "1.2cqw", fontWeight: 600, fontFamily: look.mono, padding: ".3cqw .8cqw", borderRadius: "99cqw", color: look.accent, background: look.chip }}>
                {d}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CardsBlock({ block }: { block: Block }) {
  const { look } = useBlockEnv();
  const s = block.args?.style || (look.glass ? "glass" : "grid");
  const rows = (block.rows ?? []).map(rowCells);
  const cols = +(block.args?.cols ?? 0) || Math.min(rows.length, rows.length === 4 ? 2 : 3);
  const glassy = s === "glass" || look.glass;
  const bg = s === "outline" ? "transparent" : s === "glass" && !look.glass ? (look.mode === "dark" ? "rgba(255,255,255,.06)" : "rgba(255,255,255,.6)") : glassy ? look.card.bg : look.panel;
  const ring = s === "outline" ? `inset 0 0 0 1px ${look.rule}` : glassy ? (s === "glass" && !look.glass ? `inset 0 0 0 1px ${look.ink}.14)` : look.card.ring) : `inset 0 0 0 1px ${look.rule}`;
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},minmax(0,1fr))`, gap: "1.8cqw" }}>
      {rows.map(([icon, title, text], k) => (
        <div
          key={k}
          style={{
            position: "relative", display: "flex", flexDirection: s === "iconLeft" ? "row" : "column", gap: "1.4cqw", padding: "2.4cqw",
            borderRadius: look.r, background: bg, boxShadow: ring, backdropFilter: glassy ? "blur(1.4cqw) saturate(1.4)" : "none", overflow: "hidden", minWidth: 0,
          }}
        >
          {s === "accent" && <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: ".4cqw", background: look.accent }} />}
          {s === "numbered" ? (
            <div style={{ fontSize: "3.4cqw", lineHeight: 1, fontWeight: 600, fontFamily: look.headFont, color: look.accent, letterSpacing: "-.03em" }}>
              {String(k + 1).padStart(2, "0")}
            </div>
          ) : (
            <div
              style={{
                width: "4.4cqw", height: "4.4cqw", borderRadius: "1.1cqw", display: "grid", placeItems: "center", flex: "none",
                background: s === "accent" ? look.accent : look.chip, color: s === "accent" ? look.bgSolid : look.accent,
              }}
            >
              <Icon name={icon} style={{ fontSize: "2.3cqw" }} />
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: ".6cqw", minWidth: 0 }}>
            <div style={{ fontSize: "2cqw", fontWeight: 600, letterSpacing: "-.01em", fontFamily: look.headFont }}>
              <RichText text={title} look={look} />
            </div>
            <div style={{ fontSize: "1.55cqw", lineHeight: 1.45, color: look.muted }}>
              <RichText text={text} look={look} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
