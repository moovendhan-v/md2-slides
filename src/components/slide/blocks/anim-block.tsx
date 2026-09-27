"use client";

import { useEffect, useMemo, useState } from "react";
import type { Block } from "@/engine/types";
import { rowCells } from "@/domain/deck/rows";
import { Icon } from "@/components/common/icon";
import { useBlockEnv } from "../render-context";

interface AnimItem {
  icon?: string;
  title: string;
  desc?: string;
  badge?: string;
  raw: string;
}

function parseRow(row: string): AnimItem {
  const clean = row.replace(/^-\s+/, "").trim();
  const parts = rowCells(clean);
  if (parts.length >= 3) {
    return {
      icon: parts[0]?.trim() || undefined,
      title: parts[1]?.trim() || "",
      desc: parts[2]?.trim() || undefined,
      badge: parts[3]?.trim() || undefined,
      raw: clean,
    };
  }
  if (parts.length === 2) {
    return {
      title: parts[0]?.trim() || "",
      desc: parts[1]?.trim() || undefined,
      raw: clean,
    };
  }
  return {
    title: clean,
    raw: clean,
  };
}

/** Typewriter effect hook */
function useTypewriter(
  fullText: string,
  speedMs: number = 40,
  loop: boolean = false,
  pauseMs: number = 2000
) {
  const [displayed, setDisplayed] = useState("");
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let index = 0;
    let forward = true;
    let timer: NodeJS.Timeout | null = null;
    setIsDone(false);
    setDisplayed("");

    function step() {
      if (forward) {
        if (index < fullText.length) {
          index++;
          setDisplayed(fullText.slice(0, index));
          timer = setTimeout(step, speedMs);
        } else {
          setIsDone(true);
          if (loop) {
            timer = setTimeout(() => {
              forward = false;
              step();
            }, pauseMs);
          }
        }
      } else {
        if (index > 0) {
          index--;
          setDisplayed(fullText.slice(0, index));
          timer = setTimeout(step, Math.max(15, speedMs / 2));
        } else {
          forward = true;
          timer = setTimeout(step, 400);
        }
      }
    }

    timer = setTimeout(step, speedMs);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [fullText, speedMs, loop, pauseMs]);

  return { displayed, isDone };
}

export function AnimBlock({ block }: { block: Block }) {
  const { look } = useBlockEnv();
  const args = block.args ?? {};
  const style = (args.style || (block.rows && block.rows.length > 1 ? "stagger" : "typewriter")).toLowerCase();
  const template = (args.template || "").toLowerCase();
  const customClass = args.class || args.className || "";
  const speedArg = args.speed || "normal";
  const loop = args.loop === "true" || args.loop === "1";
  const cols = parseInt(args.cols || "0", 10) || 0;

  // Speed calculation
  const speedMs = useMemo(() => {
    if (speedArg === "fast") return 22;
    if (speedArg === "slow") return 75;
    const n = parseInt(speedArg, 10);
    return isNaN(n) ? 40 : n;
  }, [speedArg]);

  const rawRows = block.rows ?? (block.text ? block.text.split("\n").filter((r) => r.trim().length > 0) : []);
  const items: AnimItem[] = useMemo(() => rawRows.map(parseRow), [rawRows]);
  const textContent = block.text || rawRows.join(" ");

  // Typewriter hook
  const { displayed, isDone } = useTypewriter(textContent, speedMs, loop);

  // Determine template style wrapper
  const templateClasses = useMemo(() => {
    switch (template) {
      case "hero":
        return "p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/30 backdrop-blur-md shadow-2xl";
      case "neon":
      case "cyberpunk":
        return "p-6 rounded-xl bg-black/80 border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] text-cyan-300 font-mono";
      case "glass":
        return "p-6 rounded-2xl bg-white/5 border border-white/15 backdrop-blur-xl shadow-lg";
      case "badge":
        return "inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/40 text-sm font-semibold";
      case "minimal":
        return "p-4 border-l-4 border-indigo-500 pl-6";
      case "gradient-card":
        return "p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/80 shadow-xl";
      default:
        return "";
    }
  }, [template]);

  // Render Typewriter
  if (style === "typewriter") {
    const cursorChar = args.cursor || "▋";
    return (
      <div className={`m2s-anim-block relative my-2 ${templateClasses} ${customClass}`}>
        <div className="font-mono text-[1.5cqw] leading-relaxed tracking-wide whitespace-pre-wrap">
          <span>{displayed}</span>
          <span
            className="inline-block ml-1 text-indigo-400 font-bold animate-[anim-blink_0.8s_infinite]"
            style={{ color: look?.accent || "#818cf8" }}
          >
            {cursorChar}
          </span>
        </div>
      </div>
    );
  }

  // Render Shimmer / Glow
  if (style === "shimmer" || style === "glow") {
    return (
      <div
        className={`m2s-anim-block relative my-2 overflow-hidden rounded-2xl p-6 border transition-all ${templateClasses} ${customClass}`}
        style={{
          borderColor: "rgba(147, 197, 253, 0.3)",
          background: "linear-gradient(135deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.85) 100%)",
        }}
      >
        {/* Animated shimmer beam overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.08) 55%, transparent 100%)",
            backgroundSize: "200% 100%",
            animation: "anim-shimmer 3.5s infinite linear",
          }}
        />
        <div className="relative z-10 flex flex-col gap-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3">
              {item.icon && (
                <div
                  className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 text-[1.4cqw]"
                  style={{ color: look?.accent }}
                >
                  <Icon name={item.icon} />
                </div>
              )}
              <div className="flex-1">
                <div className="text-[1.6cqw] font-bold text-white tracking-tight flex items-center gap-2">
                  <span>{item.title}</span>
                  {item.badge && (
                    <span className="text-[0.9cqw] uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                      {item.badge}
                    </span>
                  )}
                </div>
                {item.desc && (
                  <p className="text-[1.15cqw] text-slate-300 mt-1 leading-relaxed opacity-90">
                    {item.desc}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render Staggered / Cascade Cards
  if (style === "stagger" || style === "cascade") {
    const gridCols = cols || (items.length >= 4 ? 2 : Math.min(items.length, 3));
    return (
      <div
        className={`m2s-anim-block my-3 grid gap-4 ${templateClasses} ${customClass}`}
        style={{
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
        }}
      >
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 hover:border-indigo-400/50 hover:bg-white/10 hover:scale-[1.02] flex flex-col gap-2"
            style={{
              animation: `anim-stagger-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 140}ms both`,
            }}
          >
            {item.icon && (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-500/20 text-[1.4cqw]"
                style={{ color: look?.accent || "#818cf8" }}
              >
                <Icon name={item.icon} />
              </div>
            )}
            <div className="text-[1.35cqw] font-bold text-white tracking-tight">
              {item.title}
            </div>
            {item.desc && (
              <div className="text-[1.05cqw] text-slate-300/80 leading-snug">
                {item.desc}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Render Gradient / Aurora Text
  if (style === "gradient" || style === "aurora") {
    return (
      <div className={`m2s-anim-block my-3 ${templateClasses} ${customClass}`}>
        <div
          className="text-[2.6cqw] font-extrabold tracking-tight bg-clip-text text-transparent leading-tight"
          style={{
            backgroundImage: "linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6, #fb923c, #60a5fa)",
            backgroundSize: "300% 300%",
            animation: "anim-gradient 6s ease infinite",
          }}
        >
          {items.map((item, idx) => (
            <div key={idx} className="my-1">
              {item.title}
              {item.desc && <div className="text-[1.4cqw] font-normal opacity-90">{item.desc}</div>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render Float / Levitate
  if (style === "float" || style === "levitate") {
    return (
      <div
        className={`m2s-anim-block my-3 p-6 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-lg shadow-2xl ${templateClasses} ${customClass}`}
        style={{
          animation: "anim-float 4s ease-in-out infinite",
        }}
      >
        <div className="flex flex-col gap-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              {item.icon && (
                <span className="text-[1.6cqw]" style={{ color: look?.accent }}>
                  <Icon name={item.icon} />
                </span>
              )}
              <span className="text-[1.5cqw] font-bold text-white">{item.title}</span>
              {item.desc && <span className="text-[1.2cqw] text-slate-300"> — {item.desc}</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render Pulse / Radar
  if (style === "pulse" || style === "radar") {
    return (
      <div
        className={`m2s-anim-block my-3 p-5 rounded-2xl border border-indigo-500/40 bg-indigo-950/40 backdrop-blur-md ${templateClasses} ${customClass}`}
        style={{
          animation: "anim-pulse-glow 2.5s ease-in-out infinite",
        }}
      >
        <div className="flex flex-col gap-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-[1.4cqw] font-bold text-white">{item.title}</span>
              {item.desc && <span className="text-[1.15cqw] text-slate-300/80">{item.desc}</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render Wave (Letter / Word kinetic wave)
  if (style === "wave") {
    const words = textContent.split(" ");
    return (
      <div className={`m2s-anim-block my-3 flex flex-wrap gap-x-2 gap-y-1 ${templateClasses} ${customClass}`}>
        {words.map((w, idx) => (
          <span
            key={idx}
            className="inline-block text-[1.8cqw] font-bold text-white"
            style={{
              animation: `anim-wave 1.6s ease-in-out infinite`,
              animationDelay: `${idx * 100}ms`,
            }}
          >
            {w}
          </span>
        ))}
      </div>
    );
  }

  // Render Bounce / Pop
  if (style === "bounce" || style === "pop") {
    return (
      <div className={`m2s-anim-block my-3 flex flex-wrap gap-3 ${templateClasses} ${customClass}`}>
        {items.map((item, idx) => (
          <div
            key={idx}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border border-blue-400/40 shadow-lg text-[1.3cqw] font-semibold text-white flex items-center gap-2.5 transition-transform hover:scale-105"
            style={{
              animation: `m2s-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 150}ms both`,
            }}
          >
            {item.icon && <Icon name={item.icon} />}
            <span>{item.title}</span>
            {item.desc && <span className="text-slate-300 font-normal">({item.desc})</span>}
          </div>
        ))}
      </div>
    );
  }

  // Render 3D Flip
  if (style === "flip") {
    const gridCols = cols || (items.length >= 4 ? 2 : Math.min(items.length, 3));
    return (
      <div
        className={`m2s-anim-block my-3 grid gap-4 ${templateClasses} ${customClass}`}
        style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
      >
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-5 rounded-xl border border-white/15 bg-white/5 backdrop-blur-md transition-all hover:rotate-y-12"
            style={{
              animation: `anim-flip-in 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) ${idx * 180}ms both`,
              transformStyle: "preserve-3d",
            }}
          >
            {item.icon && (
              <div className="text-[1.6cqw] text-indigo-400 mb-2">
                <Icon name={item.icon} />
              </div>
            )}
            <div className="text-[1.3cqw] font-bold text-white">{item.title}</div>
            {item.desc && <div className="text-[1.05cqw] text-slate-300 mt-1">{item.desc}</div>}
          </div>
        ))}
      </div>
    );
  }

  // Default fallback
  return (
    <div className={`m2s-anim-block my-2 ${templateClasses} ${customClass}`}>
      <div className="text-[1.4cqw] text-white leading-relaxed">
        {textContent}
      </div>
    </div>
  );
}
