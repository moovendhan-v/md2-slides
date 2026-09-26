"use client";

import type { ReactNode } from "react";
import type { Block } from "@/engine/types";
import type { Look } from "@/domain/deck/look";
import { highlightCode } from "@/domain/deck/highlight";
import { plain } from "@/domain/deck/rich";
import { Icon } from "@/components/common/icon";
import { useBlockEnv } from "../render-context";

/** Window chrome shared by terminal and code blocks. */
function Frame({ look, header, children }: { look: Look; header: ReactNode | null; children: ReactNode }) {
  return (
    <div style={{ borderRadius: look.r, overflow: "hidden", background: look.codeBg, boxShadow: `inset 0 0 0 1px ${look.rule}` }}>
      {header}
      {children}
    </div>
  );
}

export function TerminalBlock({ block }: { block: Block }) {
  const { look } = useBlockEnv();
  const header =
    block.args?.style === "bare" ? null : (
      <div style={{ display: "flex", alignItems: "center", gap: ".7cqw", padding: "1cqw 1.4cqw", boxShadow: `inset 0 -1px 0 ${look.rule}` }}>
        {["#f87171", "#fbbf24", "#4ade80"].map((c) => (
          <span key={c} style={{ width: "1cqw", height: "1cqw", borderRadius: "50%", background: c }} />
        ))}
        <span style={{ marginLeft: "1cqw", fontSize: "1.1cqw", color: look.muted, fontFamily: look.mono }}>{block.args?._title || "zsh"}</span>
      </div>
    );
  return (
    <Frame look={look} header={header}>
      <div style={{ padding: "1.8cqw 2.2cqw", fontFamily: look.mono, fontSize: look.codeSize, lineHeight: 1.7, display: "flex", flexDirection: "column" }}>
        {(block.rows ?? []).map((r, i) => (
          <div key={i} style={{ whiteSpace: "pre", overflow: "hidden", textOverflow: "ellipsis" }}>
            {r.startsWith("$") ? (
              <>
                <span style={{ color: look.accent }}>$ </span>
                <span style={{ color: look.fg }}>{r.slice(1).trim()}</span>
              </>
            ) : (
              <span style={{ color: look.muted }}>{r || " "}</span>
            )}
          </div>
        ))}
      </div>
    </Frame>
  );
}

export function CodeBlock({ block }: { block: Block }) {
  const { look, opts } = useBlockEnv();
  const steps = block.steps ?? null;
  const step = steps ? Math.min(steps.length - 1, Math.max(0, opts.codeStep || 0)) : -1;
  const active = steps ? steps[step] : block.hl ?? [];
  const dim = !!(steps && active);
  const hl = new Set(active ?? []);
  const title =
    (block.title || `snippet.${block.lang}`) + (steps ? `  ·  step ${step + 1}/${steps.length}` : "") + (block.imported ? `  ·  ⎘ ${block.imported}` : "");
  const header =
    block.args?.style === "bare" ? null : (
      <div style={{ display: "flex", alignItems: "center", gap: "1cqw", padding: ".9cqw 1.6cqw", boxShadow: `inset 0 -1px 0 ${look.rule}`, fontFamily: look.mono, fontSize: "1.15cqw", color: look.muted }}>
        <Icon name="file-code" />
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
        <span style={{ textTransform: "uppercase", letterSpacing: ".1em" }}>{block.lang}</span>
      </div>
    );
  return (
    <Frame look={look} header={header}>
      <div style={{ padding: "1.6cqw 0", fontFamily: look.mono, fontSize: look.codeSize, lineHeight: 1.65 }}>
        {(block.code ?? []).map((ln, k) => {
          const on = hl.has(k + 1);
          const isNew = block.magic && opts.prevCode && !opts.prevCode.has(ln.trim());
          return (
            <div
              key={k + ln}
              style={{
                display: "flex", padding: "0 2.2cqw", background: on ? look.chip : "transparent", boxShadow: on ? `inset .3cqw 0 0 ${look.accent}` : "none",
                opacity: dim && !on ? 0.32 : 1, transition: "opacity .3s, background .3s",
                animation: isNew ? `sw-magic .6s cubic-bezier(.2,.7,.2,1) ${k * 25}ms both` : "none",
              }}
            >
              <span style={{ width: "3cqw", flex: "none", color: look.muted, opacity: 0.6, userSelect: "none" }}>{k + 1}</span>
              <span style={{ whiteSpace: "pre", overflow: "hidden" }}>
                {highlightCode(ln || " ", look).map((sg, i) => (
                  <span key={i} style={{ color: sg.c }}>
                    {sg.t}
                  </span>
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </Frame>
  );
}

export function TableBlock({ block }: { block: Block }) {
  const { look } = useBlockEnv();
  const head = block.head ?? [];
  const cols = `repeat(${head.length},minmax(0,1fr))`;
  return (
    <div
      style={{
        display: "flex", flexDirection: "column", fontSize: look.tableSize, borderRadius: look.r, overflow: "hidden",
        boxShadow: look.card.ring, background: look.card.bg, backdropFilter: look.card.blur,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: cols, background: `${look.ink}.03)` }}>
        {head.map((h, i) => (
          <div key={i} style={{ padding: "1.1cqw 1.6cqw", color: look.muted, fontWeight: 600, fontSize: "1.25cqw", letterSpacing: ".08em", textTransform: "uppercase" }}>
            {h}
          </div>
        ))}
      </div>
      {(block.tableRows ?? []).map((r, k) => (
        <div key={k} style={{ display: "grid", gridTemplateColumns: cols, background: k % 2 ? `${look.ink}.02)` : "transparent", boxShadow: `inset 0 1px 0 ${look.rule}` }}>
          {r.map((t, j) => (
            <div key={j} style={{ padding: "1.2cqw 1.6cqw", fontWeight: /\*\*/.test(t) || j === 0 ? 600 : 400 }}>
              {plain(t)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
