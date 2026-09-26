"use client";

import { useEffect } from "react";
import { AuthScreen } from "@/features/auth/auth-screen";
import { BootScreen } from "@/components/shell/boot-screen";
import { useMeQuery } from "@/hooks/use-queries";
import { useUi } from "@/stores/ui";
import { Providers } from "./providers";
import { Workspace } from "./workspace";

function useViewportWidth() {
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

function Gate() {
  useViewportWidth();
  const me = useMeQuery();
  if (me.isPending) return <BootScreen label="Checking your GitHub session…" />;
  if (me.isError) return <BootScreen label={`Could not reach the server: ${me.error.message}`} />;
  return me.data.user ? <Workspace /> : <AuthScreen />;
}

/** Client application root (mounted by `src/app/page.tsx`). */
export function App() {
  return (
    <Providers>
      <Gate />
    </Providers>
  );
}
