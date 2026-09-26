"use client";

import { useEffect, useState } from "react";

/** `value`, updated only after it has been stable for `ms` (0 = immediate). */
export function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    if (!ms) return setV(value);
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return ms ? v : value;
}
