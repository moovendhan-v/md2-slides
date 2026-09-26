"use client";

import type { Block } from "@/engine/types";
import type { Look } from "@/domain/deck/look";
import { hexA } from "@/domain/deck/look";
import { rowCells } from "@/domain/deck/rows";
import { useBlockEnv } from "../render-context";
import { ellipsis, surface } from "./styles";

interface Datum {
  l: string;
  v: string;
  n: number;
  pct: string;
  share: string;
  c: string;
}

function data(b: Block, look: Look): Datum[] {
  const rows = (b.rows ?? []).map((r) => {
    const [l, v] = rowCells(r);
    return { l: l || "", v: v || "", n: parseFloat(String(v || "0").replace(/[^\d.-]/g, "")) || 0 };
  });
  const max = Math.max(1, ...rows.map((r) => r.n));
  const sum = rows.reduce((a, r) => a + r.n, 0) || 1;
  const dark = look.mode === "dark";
  const pal = [look.accent, hexA(look.accent, 0.65), hexA(look.accent, 0.4), dark ? "#a1a1aa" : "#52525b", hexA(look.accent, 0.22), dark ? "#3f3f46" : "#d4d4d8"];
  return rows.map((r, k) => ({ ...r, pct: ((r.n / max) * 100).toFixed(1) + "%", share: Math.round((r.n / sum) * 100) + "%", c: pal[k % pal.length] }));
}

function Columns({ d, look }: { d: Datum[]; look: Look }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "2cqw", height: "20cqw" }}>
      {d.map((c, i) => (
        <div key={i} style={{ flex: 1, minWidth: 0, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: ".6cqw" }}>
          <span style={{ fontSize: "1.25cqw", fontWeight: 600, fontFamily: look.mono }}>{c.v}</span>
          <div style={{ width: "100%", maxWidth: "7cqw", height: c.pct, borderRadius: ".6cqw .6cqw 0 0", background: c.c }} />
          <span style={{ fontSize: "1.15cqw", color: look.muted, ...ellipsis }}>{c.l}</span>
        </div>
      ))}
    </div>
  );
}

function Bars({ d, look }: { d: Datum[]; look: Look }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.3cqw" }}>
      {d.map((c, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "12cqw minmax(0,1fr) 6cqw", gap: "1.4cqw", alignItems: "center", fontSize: "1.4cqw" }}>
          <span style={{ color: look.muted, ...ellipsis }}>{c.l}</span>
          <div style={{ height: "1.8cqw", borderRadius: "1cqw", background: look.rule, overflow: "hidden" }}>
            <div style={{ height: "100%", width: c.pct, background: c.c, borderRadius: "1cqw" }} />
          </div>
          <span style={{ fontWeight: 600, fontFamily: look.mono }}>{c.v}</span>
        </div>
      ))}
    </div>
  );
}

function Line({ d, look }: { d: Datum[]; look: Look }) {
  const max = Math.max(1, ...d.map((r) => r.n));
  const pts = d.map((r, k) => (((d.length > 1 ? k / (d.length - 1) : 0.5) * 100).toFixed(1) + "," + (38 - (r.n / max) * 34).toFixed(1))).join(" ");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1cqw" }}>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width: "100%", height: "18cqw", overflow: "visible" }}>
        <polygon points={`0,40 ${pts} 100,40`} fill={look.chip} />
        <polyline points={pts} fill="none" stroke={look.accent} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.15cqw", color: look.muted }}>
        {d.map((c, i) => (
          <span key={i}>{c.l}</span>
        ))}
      </div>
    </div>
  );
}

function Donut({ d, look, hole, total }: { d: Datum[]; look: Look; hole: boolean; total: string }) {
  const sum = d.reduce((a, r) => a + r.n, 0) || 1;
  let acc = 0;
  const conic = d.map((r) => { const a = acc; acc += (r.n / sum) * 100; return `${r.c} ${a.toFixed(2)}% ${acc.toFixed(2)}%`; }).join(", ");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4cqw" }}>
      <div style={{ position: "relative", width: "18cqw", height: "18cqw", flex: "none", borderRadius: "50%", background: `conic-gradient(${conic})` }}>
        {hole && (
          <div style={{ position: "absolute", inset: "4cqw", borderRadius: "50%", background: look.bgSolid, display: "grid", placeItems: "center", fontSize: "2.2cqw", fontWeight: 700, fontFamily: look.headFont }}>
            {total}
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.1cqw", minWidth: 0 }}>
        {d.map((c, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "1cqw", fontSize: "1.5cqw" }}>
            <span style={{ width: "1.4cqw", height: "1.4cqw", borderRadius: ".3cqw", background: c.c, flex: "none" }} />
            <span style={{ flex: 1, color: look.muted }}>{c.l}</span>
            <span style={{ fontWeight: 600, fontFamily: look.mono }}>{c.share}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Rings({ d, look }: { d: Datum[]; look: Look }) {
  return (
    <div style={{ display: "flex", gap: "3cqw", justifyContent: "space-around", flexWrap: "wrap" }}>
      {d.map((c, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1cqw" }}>
          <div style={{ width: "12cqw", height: "12cqw", borderRadius: "50%", background: `conic-gradient(${look.accent} 0 ${Math.min(100, c.n)}%, ${look.rule} 0)`, display: "grid", placeItems: "center" }}>
            <div style={{ width: "9.4cqw", height: "9.4cqw", borderRadius: "50%", background: look.bgSolid, display: "grid", placeItems: "center", fontSize: "2.2cqw", fontWeight: 700, fontFamily: look.headFont }}>
              {c.v}
            </div>
          </div>
          <span style={{ fontSize: "1.4cqw", color: look.muted }}>{c.l}</span>
        </div>
      ))}
    </div>
  );
}

export function ChartBlock({ block }: { block: Block }) {
  const { look } = useBlockEnv();
  const d = data(block, look);
  const s = block.args?.style || "column";
  const body =
    s === "bar" ? <Bars d={d} look={look} />
    : s === "line" ? <Line d={d} look={look} />
    : s === "donut" || s === "pie" ? <Donut d={d} look={look} hole={s === "donut"} total={block.args?._title || ""} />
    : s === "rings" ? <Rings d={d} look={look} />
    : <Columns d={d} look={look} />;
  return <div style={surface(look.card, { padding: "2cqw", borderRadius: look.r })}>{body}</div>;
}
