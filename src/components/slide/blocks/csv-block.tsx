"use client";

import { useMemo } from "react";
import type { Block } from "@/engine/types";
import type { Look } from "@/domain/deck/look";
import { hexA } from "@/domain/deck/look";
import { useBlockEnv } from "../render-context";
import { surface } from "./styles";

/** Parse CSV rows. Handles quoted fields with embedded commas. */
function parseCsv(raw: string): string[][] {
  return raw
    .split("\n")
    .filter((l) => l.trim())
    .map((line) => {
      const row: string[] = [];
      let field = "";
      let inQuote = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          inQuote = !inQuote;
        } else if (c === "," && !inQuote) {
          row.push(field.trim());
          field = "";
        } else {
          field += c;
        }
      }
      row.push(field.trim());
      return row;
    });
}

function CsvTable({ rows, head, look }: { rows: string[][]; head: string[]; look: Look }) {
  const thStyle: React.CSSProperties = {
    textAlign: "left",
    fontSize: "1.1cqw",
    fontWeight: 700,
    letterSpacing: ".06em",
    textTransform: "uppercase",
    color: look.accent,
    padding: ".7cqw 1.2cqw",
    borderBottom: `1px solid ${look.rule}`,
    whiteSpace: "nowrap",
  };
  const tdStyle: React.CSSProperties = {
    fontSize: "1.4cqw",
    padding: ".6cqw 1.2cqw",
    color: look.fg,
    borderBottom: `1px solid ${look.rule}`,
    fontFamily: look.mono,
  };
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {head.map((h, i) => (
            <th key={i} style={thStyle}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} style={{ background: ri % 2 === 1 ? hexA(look.accent, 0.04) : "transparent" }}>
            {row.map((cell, ci) => (
              <td key={ci} style={tdStyle}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CsvBars({ rows, head, look }: { rows: string[][]; head: string[]; look: Look }) {
  // Expects: label col + one or more numeric cols
  const labelCol = 0;
  const valCols = head.slice(1).map((_, i) => i + 1);
  const palette = [look.accent, hexA(look.accent, 0.65), hexA(look.accent, 0.4)];
  const allNums = rows.flatMap((r) => valCols.map((c) => parseFloat(r[c] ?? "0") || 0));
  const maxVal = Math.max(1, ...allNums);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.1cqw" }}>
      {valCols.length > 1 && (
        <div style={{ display: "flex", gap: "2cqw", marginBottom: ".5cqw" }}>
          {valCols.map((c, k) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: ".6cqw", fontSize: "1.1cqw", color: look.muted }}>
              <span style={{ width: "1.2cqw", height: "1.2cqw", borderRadius: ".2cqw", background: palette[k % palette.length] }} />
              {head[c]}
            </div>
          ))}
        </div>
      )}
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: "grid", gridTemplateColumns: `14cqw 1fr`, gap: "1.2cqw", alignItems: "center" }}>
          <span style={{ fontSize: "1.3cqw", color: look.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {row[labelCol]}
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: ".5cqw" }}>
            {valCols.map((c, k) => {
              const val = parseFloat(row[c] ?? "0") || 0;
              const pct = ((val / maxVal) * 100).toFixed(1) + "%";
              return (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: "1cqw" }}>
                  <div style={{ flex: 1, height: "1.6cqw", borderRadius: "1cqw", background: look.rule, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: pct,
                        background: palette[k % palette.length],
                        borderRadius: "1cqw",
                        transition: "width .6s cubic-bezier(.4,0,.2,1)",
                      }}
                    />
                  </div>
                  <span style={{ fontFamily: look.mono, fontSize: "1.2cqw", fontWeight: 600, minWidth: "4cqw", textAlign: "right" }}>{row[c]}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function CsvColumns({ rows, head, look }: { rows: string[][]; head: string[]; look: Look }) {
  const valCols = head.slice(1).map((_, i) => i + 1);
  const palette = [look.accent, hexA(look.accent, 0.65), hexA(look.accent, 0.4)];
  const allNums = rows.flatMap((r) => valCols.map((c) => parseFloat(r[c] ?? "0") || 0));
  const maxVal = Math.max(1, ...allNums);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1cqw" }}>
      {valCols.length > 1 && (
        <div style={{ display: "flex", gap: "2cqw", marginBottom: ".5cqw" }}>
          {valCols.map((c, k) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: ".6cqw", fontSize: "1.1cqw", color: look.muted }}>
              <span style={{ width: "1.2cqw", height: "1.2cqw", borderRadius: ".2cqw", background: palette[k % palette.length] }} />
              {head[c]}
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "flex-end", gap: "1.2cqw", height: "18cqw" }}>
        {rows.map((row, ri) => (
          <div key={ri} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: ".4cqw", height: "100%", justifyContent: "flex-end" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: ".3cqw", width: "100%" }}>
              {valCols.map((c, k) => {
                const val = parseFloat(row[c] ?? "0") || 0;
                const pct = ((val / maxVal) * 100).toFixed(1) + "%";
                return (
                  <div
                    key={k}
                    style={{
                      flex: 1,
                      height: pct,
                      background: palette[k % palette.length],
                      borderRadius: ".4cqw .4cqw 0 0",
                      transition: "height .6s cubic-bezier(.4,0,.2,1)",
                    }}
                  />
                );
              })}
            </div>
            <span style={{ fontSize: "1.1cqw", color: look.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%", textAlign: "center" }}>
              {row[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CsvLine({ rows, head, look }: { rows: string[][]; head: string[]; look: Look }) {
  const valCols = head.slice(1).map((_, i) => i + 1);
  const palette = [look.accent, hexA(look.accent, 0.65), hexA(look.accent, 0.4)];
  const allNums = rows.flatMap((r) => valCols.map((c) => parseFloat(r[c] ?? "0") || 0));
  const maxVal = Math.max(1, ...allNums);
  const minVal = Math.min(0, ...allNums);
  const range = maxVal - minVal || 1;
  const n = rows.length;

  const pts = (colIdx: number) =>
    rows.map((r, i) => {
      const val = parseFloat(r[colIdx] ?? "0") || 0;
      const x = n > 1 ? (i / (n - 1)) * 100 : 50;
      const y = 38 - ((val - minVal) / range) * 34;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1cqw" }}>
      {valCols.length > 1 && (
        <div style={{ display: "flex", gap: "2cqw" }}>
          {valCols.map((c, k) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: ".6cqw", fontSize: "1.1cqw", color: look.muted }}>
              <span style={{ width: "1.2cqw", height: ".3cqw", background: palette[k % palette.length] }} />
              {head[c]}
            </div>
          ))}
        </div>
      )}
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width: "100%", height: "16cqw", overflow: "visible" }}>
        {valCols.map((c, k) => (
          <polyline key={k} points={pts(c)} fill="none" stroke={palette[k % palette.length]} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1cqw", color: look.muted }}>
        {rows.map((r, i) => <span key={i}>{r[0]}</span>)}
      </div>
    </div>
  );
}

/** Renders a :::csv block. Parses CSV, first row = header. style=table|bar|column|line */
export function CsvBlock({ block }: { block: Block }) {
  const { look } = useBlockEnv();
  const raw = (block.rows ?? []).join("\n");
  const style = block.args?.style ?? "table";

  const { head, rows } = useMemo(() => {
    const parsed = parseCsv(raw);
    if (parsed.length === 0) return { head: [], rows: [] };
    return { head: parsed[0], rows: parsed.slice(1) };
  }, [raw]);

  if (rows.length === 0) {
    return (
      <div style={{ color: look.muted, fontSize: "1.4cqw", padding: "2cqw", textAlign: "center" }}>
        No CSV data
      </div>
    );
  }

  let body: React.ReactNode;
  if (style === "bar") body = <CsvBars rows={rows} head={head} look={look} />;
  else if (style === "column") body = <CsvColumns rows={rows} head={head} look={look} />;
  else if (style === "line") body = <CsvLine rows={rows} head={head} look={look} />;
  else body = <CsvTable rows={rows} head={head} look={look} />;

  return <div style={surface(look.card, { padding: "1.6cqw", borderRadius: look.r, overflowX: "auto" })}>{body}</div>;
}
