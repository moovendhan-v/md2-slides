"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { SlideEngine } from "./engine";
import { loadEngine } from "./client";

const EngineContext = createContext<SlideEngine | null>(null);

/** Loads the Wasm engine once and gates children until it is ready. */
export function EngineProvider({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const [engine, setEngine] = useState<SlideEngine | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    loadEngine().then(setEngine, (e: Error) => setError(e.message));
  }, []);
  if (error) return <div className="grid h-screen place-items-center text-sm text-red-400">Engine failed to load: {error}</div>;
  if (!engine) return <>{fallback}</>;
  return <EngineContext.Provider value={engine}>{children}</EngineContext.Provider>;
}

export function useEngine(): SlideEngine {
  const e = useContext(EngineContext);
  if (!e) throw new Error("useEngine must be used inside <EngineProvider>");
  return e;
}
