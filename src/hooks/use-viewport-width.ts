"use client";

import { useEffect } from "react";
import { useUi } from "@/stores/ui";

/** Track the window width in the UI store and collapse side panels on small screens. */
export function useViewportWidth() {
  useEffect(() => {
    const onResize = () => {
      const ui = useUi.getState();
      const w = window.innerWidth;
      ui.set({ width: w, ...(w <= 760 && ui.width > 760 ? { sidebarOpen: false } : {}), ...(w < 1000 && ui.width >= 1000 ? { customOpen: false } : {}) });
    };
    const w = window.innerWidth;
    useUi.getState().set({ width: w, sidebarOpen: w > 760, customOpen: w > 1200 });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
}
