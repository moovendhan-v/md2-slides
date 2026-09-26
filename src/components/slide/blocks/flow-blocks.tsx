"use client";

import type { Block } from "@/engine/types";
import type { Look } from "@/domain/deck/look";
import { hexA } from "@/domain/deck/look";
import { rowCells } from "@/domain/deck/rows";
import { Icon } from "@/components/common/icon";
import { useBlockEnv } from "../render-context";
import { ellipsis } from "./styles";

interface Node {
  icon: string;
  t: string;
  sub: string;
  last: boolean;
}

const nodesOf = (b: Block): Node[] =>
  (b.rows ?? []).map((r, k, a) => {
    const [icon, t, sub] = rowCells(r);
    return { icon, t: t || "", sub: sub || "", last: k === a.length - 1 };
  });

function Pipeline({ nodes, look }: { nodes: Node[]; look: Look }) {
  return (
    <div style={{ display: "flex", alignItems: "stretch", padding: "1.6cqw", borderRadius: look.r }}>
      {nodes.map((n, k) => (
        <div key={k} style={{ display: "flex", alignItems: "center", flex: "1 1 0", minWidth: 0 }}>
          <div
            style={{
              flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: ".6cqw",
              padding: "1.6cqw 1cqw", borderRadius: "1cqw", background: n.last ? look.chip : look.card.bg,
              boxShadow: n.last ? `inset 0 0 0 1px ${look.accent}` : look.card.ring,
            }}
          >
            <Icon name={n.icon} style={{ fontSize: "2.2cqw", color: look.accent }} />
            <div style={{ fontSize: "1.5cqw", fontWeight: 600, ...ellipsis }}>{n.t}</div>
            <div style={{ fontSize: "1.05cqw", color: look.muted, fontFamily: look.mono, ...ellipsis }}>{n.sub}</div>
          </div>
          {!n.last && (
            <div style={{ flex: "none", width: "2.8cqw", display: "flex", alignItems: "center", justifyContent: "center", color: look.accent }}>
              <Icon name="arrow-right" style={{ fontSize: "1.7cqw" }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Steps({ nodes, look }: { nodes: Node[]; look: Look }) {
  return (
    <div style={{ display: "flex", gap: "2cqw" }}>
      {nodes.map((n, k) => (
        <div key={k} style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: "1.2cqw" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1cqw" }}>
            <div
              style={{
                width: "4cqw", height: "4cqw", borderRadius: "50%", display: "grid", placeItems: "center", fontSize: "1.6cqw", fontWeight: 700, flex: "none",
                background: k === 0 ? look.accent : "transparent", color: k === 0 ? look.bgSolid : look.accent, boxShadow: `inset 0 0 0 .2cqw ${look.accent}`,
              }}
            >
              {k + 1}
            </div>
            {!n.last && <div style={{ flex: 1, height: ".2cqw", background: look.rule }} />}
          </div>
          <div style={{ fontSize: "1.8cqw", fontWeight: 600, fontFamily: look.headFont }}>{n.t}</div>
          <div style={{ fontSize: "1.35cqw", color: look.muted }}>{n.sub}</div>
        </div>
      ))}
    </div>
  );
}

/** stack / funnel / pyramid share one row layout with different indents and fills. */
function Stack({ nodes, look, variant }: { nodes: Node[]; look: Look; variant: string }) {
  const N = nodes.length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: ".8cqw" }}>
      {nodes.map((n, k) => {
        const shaped = variant === "funnel" || variant === "pyramid";
        const j = variant === "funnel" ? k : N - 1 - k;
        const bg = shaped ? hexA(look.accent, 0.9 - j * (0.6 / Math.max(1, N - 1))) : n.last ? look.chip : look.card.bg;
        const ring = shaped ? "none" : n.last ? `inset 0 0 0 1px ${look.accent}` : look.card.ring;
        const indent = shaped ? j * 5 + "cqw" : variant === "stack" ? k * 1.4 + "cqw" : "0";
        return (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: "1.6cqw", padding: "1.1cqw 1.8cqw", borderRadius: "1cqw", background: bg, boxShadow: ring, margin: `0 ${indent}` }}>
            <Icon name={n.icon} style={{ fontSize: "2cqw", color: shaped ? look.bgSolid : look.accent }} />
            <div style={{ fontSize: "1.7cqw", fontWeight: 600, flex: 1 }}>{n.t}</div>
            <div style={{ fontSize: "1.25cqw", color: look.muted, fontFamily: look.mono }}>{n.sub}</div>
          </div>
        );
      })}
    </div>
  );
}

function Radial({ nodes, look, hub }: { nodes: Node[]; look: Look; hub: boolean }) {
  const sat = hub ? nodes.slice(1) : nodes;
  const pos = sat.map((n, k) => {
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / sat.length;
    return { ...n, x: 50 + 34 * Math.cos(a), y: 50 + 38 * Math.sin(a) };
  });
  const pill = (n: Node, left: string, top: string, center: boolean, key: string | number) => (
    <div
      key={key}
      style={{
        position: "absolute", left, top, transform: "translate(-50%,-50%)", display: "flex", alignItems: "center", gap: ".8cqw", padding: ".9cqw 1.4cqw",
        borderRadius: "99cqw", background: center ? look.accent : look.card.bg, boxShadow: center ? "none" : look.card.ring, whiteSpace: "nowrap", backdropFilter: look.card.blur,
      }}
    >
      <Icon name={n.icon} style={{ fontSize: "1.8cqw", color: center ? look.bgSolid : look.accent }} />
      <span style={{ fontSize: "1.45cqw", fontWeight: 600, color: center ? look.bgSolid : look.fg }}>{n.t}</span>
    </div>
  );
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "2.4 / 1" }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {!hub && <ellipse cx="50" cy="50" rx="34" ry="38" fill="none" stroke={look.rule} strokeWidth="1.5" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />}
        {hub && pos.map((p, i) => <line key={i} x1="50" y1="50" x2={p.x} y2={p.y} stroke={look.accent} strokeOpacity=".45" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />)}
      </svg>
      {pos.map((p, i) => pill(p, p.x + "%", p.y + "%", false, i))}
      {nodes[0] && pill(nodes[0], "50%", "50%", true, "c")}
    </div>
  );
}

export function FlowBlock({ block }: { block: Block }) {
  const { look } = useBlockEnv();
  const nodes = nodesOf(block);
  const s = block.args?.style || "pipeline";
  if (s === "hub" || s === "cycle") return <Radial nodes={nodes} look={look} hub={s === "hub"} />;
  if (s === "steps") return <Steps nodes={nodes} look={look} />;
  if (s === "stack" || s === "funnel" || s === "pyramid") return <Stack nodes={nodes} look={look} variant={s} />;
  return <Pipeline nodes={nodes} look={look} />;
}

export function TimelineBlock({ block }: { block: Block }) {
  const { look } = useBlockEnv();
  const vertical = block.args?.style === "v";
  const items = (block.rows ?? []).map((r, k, a) => {
    const [when, what = ""] = rowCells(r);
    const done = !/\?$/.test(what);
    return { when, what: what.replace(/\?$/, ""), wc: done ? look.accent : look.muted, dot: done ? look.accent : "transparent", line: k === a.length - 1 ? "transparent" : look.rule };
  });
  const whenStyle = { fontSize: "1.25cqw", fontWeight: 600, fontFamily: look.mono, letterSpacing: ".1em", textTransform: "uppercase" as const };
  const dot = (c: string) => <span style={{ width: "1.6cqw", height: "1.6cqw", borderRadius: "50%", flex: "none", background: c, boxShadow: `inset 0 0 0 .25cqw ${look.accent}` }} />;
  if (vertical)
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        {items.map((t, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "8cqw 2cqw minmax(0,1fr)", gap: "1.4cqw", alignItems: "start" }}>
            <div style={{ ...whenStyle, color: t.wc, textAlign: "right", paddingTop: ".2cqw" }}>{t.when}</div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", alignSelf: "stretch" }}>
              {dot(t.dot)}
              <span style={{ flex: 1, width: ".2cqw", minHeight: "1.6cqw", background: t.line }} />
            </div>
            <div style={{ fontSize: "1.75cqw", fontWeight: 500, lineHeight: 1.3, paddingBottom: "1.4cqw" }}>{t.what}</div>
          </div>
        ))}
      </div>
    );
  return (
    <div style={{ display: "flex", gap: "1.6cqw" }}>
      {items.map((t, i) => (
        <div key={i} style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: "1cqw" }}>
          <div style={{ ...whenStyle, color: t.wc }}>{t.when}</div>
          <div style={{ display: "flex", alignItems: "center" }}>
            {dot(t.dot)}
            <span style={{ flex: 1, height: ".2cqw", background: t.line }} />
          </div>
          <div style={{ fontSize: "1.75cqw", fontWeight: 500, lineHeight: 1.3, paddingRight: "1cqw" }}>{t.what}</div>
        </div>
      ))}
    </div>
  );
}
