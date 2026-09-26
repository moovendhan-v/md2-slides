"use client";

import { useEffect, useRef } from "react";
import { usePresent } from "@/stores/present";

/** Freehand pen layer over the presented slide (cleared on slide change). */
export function InkCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const { pen, penColor, inkClear } = usePresent();

  useEffect(() => {
    const cv = ref.current;
    cv?.getContext("2d")?.clearRect(0, 0, cv.width, cv.height);
  }, [inkClear]);

  const ctx = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cv = e.currentTarget;
    const r = cv.getBoundingClientRect();
    if (cv.width !== Math.round(r.width)) {
      cv.width = r.width;
      cv.height = r.height;
    }
    return { g: cv.getContext("2d")!, x: e.clientX - r.left, y: e.clientY - r.top };
  };

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 size-full"
      style={{ pointerEvents: pen ? "auto" : "none", cursor: pen ? "crosshair" : "default" }}
      onPointerDown={(e) => {
        const { g, x, y } = ctx(e);
        Object.assign(g, { strokeStyle: penColor, lineWidth: 3.5, lineCap: "round", lineJoin: "round" });
        g.beginPath();
        g.moveTo(x, y);
        drawing.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drawing.current) return;
        const { g, x, y } = ctx(e);
        g.lineTo(x, y);
        g.stroke();
      }}
      onPointerUp={() => (drawing.current = false)}
    />
  );
}
