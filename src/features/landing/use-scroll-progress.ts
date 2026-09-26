"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Scroll progress (0 → 1) through a tall, sticky section. Kept in a ref for
 * the render loop (no React re-render per frame) plus a coarse state value
 * for captions.
 */
export function useScrollProgress(section: RefObject<HTMLElement | null>, steps = 20) {
  const progress = useRef(0);
  const [coarse, setCoarse] = useState(0);
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    let frame = 0;
    const read = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const span = Math.max(1, r.height - window.innerHeight);
      const p = Math.min(1, Math.max(0, -r.top / span));
      progress.current = p;
      setCoarse((c) => (Math.round(c * steps) === Math.round(p * steps) ? c : p));
    };
    const onScroll = () => (frame ||= requestAnimationFrame(read));
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [section, steps]);
  return { progress, coarse };
}

/** True when the user asked for less motion, or WebGL isn't available. */
export function usePrefersStatic() {
  const [still, setStill] = useState<boolean | null>(null);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let webgl = false;
    try {
      webgl = !!document.createElement("canvas").getContext("webgl2");
    } catch {}
    setStill(reduced || !webgl);
  }, []);
  return still;
}
