"use client";

import { useEffect, useRef, useState } from "react";
import type { Block } from "@/engine/types";
import { hexA } from "@/domain/deck/look";
import { rowCells } from "@/domain/deck/rows";
import { useBlockEnv } from "../render-context";

interface CounterDatum {
  value: number;
  suffix: string;
  prefix: string;
  label: string;
  sublabel: string;
}

function parseDatum(row: string): CounterDatum {
  const [raw, label = "", sublabel = ""] = rowCells(row);
  const clean = (raw ?? "").trim();
  // Extract optional prefix (e.g. "$")
  const prefixMatch = clean.match(/^([^0-9.-]*)/);
  const prefix = prefixMatch ? prefixMatch[1] : "";
  const rest = clean.slice(prefix.length);
  // Numeric part then suffix
  const numMatch = rest.match(/^([\d.,]+(?:\.\d+)?)/);
  const numStr = numMatch ? numMatch[1].replace(/,/g, "") : "0";
  const value = parseFloat(numStr) || 0;
  const suffix = rest.slice(numStr.length);
  return { value, suffix, prefix, label, sublabel };
}

function useCountUp(target: number, duration = 1400): number {
  const [count, setCount] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const isFloat = !Number.isInteger(target);

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const cur = from + (target - from) * eased;
      setCount(isFloat ? parseFloat(cur.toFixed(2)) : Math.round(cur));
      if (progress < 1) {
        raf.current = requestAnimationFrame(tick);
      }
    }
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current != null) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return count;
}

function FlipDigit({ char }: { char: string }) {
  const [prev, setPrev] = useState(char);
  const [flip, setFlip] = useState(false);

  useEffect(() => {
    if (char === prev) return;
    setFlip(true);
    const t = setTimeout(() => {
      setPrev(char);
      setFlip(false);
    }, 150);
    return () => clearTimeout(t);
  }, [char, prev]);

  return (
    <span
      style={{
        display: "inline-block",
        minWidth: char === "," || char === "." ? ".5em" : ".7em",
        textAlign: "center",
        transform: flip ? "translateY(-10%) scaleY(.7)" : "none",
        opacity: flip ? 0 : 1,
        transition: "transform .15s ease, opacity .15s ease",
      }}
    >
      {prev}
    </span>
  );
}

function AnimatedNumber({ value, prefix, suffix, style }: { value: number; prefix: string; suffix: string; style: string }) {
  const count = useCountUp(value);
  const isFloat = !Number.isInteger(value);
  const formatted = isFloat
    ? count.toFixed(String(value).split(".")[1]?.length ?? 2)
    : count.toLocaleString();

  if (style === "flip") {
    const chars = (prefix + formatted + suffix).split("");
    return (
      <span style={{ display: "inline-flex" }}>
        {chars.map((c, i) => <FlipDigit key={i} char={c} />)}
      </span>
    );
  }
  return <>{prefix}{formatted}{suffix}</>;
}

/** Renders a :::counter block — animated counting numbers for big-stat slides. */
export function CounterBlock({ block }: { block: Block }) {
  const { look } = useBlockEnv();
  const rows = block.rows ?? [];
  const style = block.args?.style ?? "up";
  const data = rows.map(parseDatum);
  const accentPal = [look.accent, hexA(look.accent, 0.8), hexA(look.accent, 0.6)];

  return (
    <div
      style={{
        display: "flex",
        gap: "3cqw",
        justifyContent: data.length === 1 ? "flex-start" : "space-around",
        flexWrap: "wrap",
        padding: "1cqw 0",
      }}
    >
      {data.map((d, i) => {
        const color = accentPal[i % accentPal.length];
        return (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: ".6cqw",
              textAlign: "center",
              flex: "1 1 0",
              minWidth: "10cqw",
            }}
          >
            {/* Accent bar above */}
            <div style={{ width: "3cqw", height: ".35cqw", borderRadius: ".2cqw", background: color, marginBottom: ".3cqw" }} />
            {/* The number */}
            <div
              style={{
                fontFamily: look.headFont,
                fontSize: data.length === 1 ? "9cqw" : "6cqw",
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: "-.04em",
                color,
              }}
            >
              <AnimatedNumber value={d.value} prefix={d.prefix} suffix={d.suffix} style={style} />
            </div>
            {/* Label */}
            {d.label && (
              <div style={{ fontSize: "1.6cqw", fontWeight: 600, color: look.fg, letterSpacing: ".01em" }}>
                {d.label}
              </div>
            )}
            {/* Sublabel */}
            {d.sublabel && (
              <div style={{ fontSize: "1.2cqw", color: look.muted }}>
                {d.sublabel}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
