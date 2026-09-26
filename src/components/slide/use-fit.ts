"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Safety net for pagination estimates: if a slide's content still overflows
 * once rendered, scale it down (CSS zoom) until it fits. Ratios are measured
 * in container units, so the result is independent of the thumbnail size.
 */
export function useFitToSlide(deps: unknown[], baseZoom: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cs = getComputedStyle(el);
    const avail = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const top = el.getBoundingClientRect().top;
    const kids = [...el.children];
    if (!kids.length || avail <= 0) return;
    const zoom = baseZoom * fit;
    const used = (Math.max(...kids.map((c) => c.getBoundingClientRect().bottom)) - top) / zoom - parseFloat(cs.paddingTop);
    const next = used > avail + 1 ? Math.max(0.45, (avail / used) * 0.98) : 1;
    if (Math.abs(next - fit) > 0.01) setFit(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-measure when the slide content changes
  }, deps);
  return { ref, fit };
}
