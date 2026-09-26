"use client";

import { useEffect, useSyncExternalStore } from "react";
import { AuthScreen } from "@/features/auth/auth-screen";
import { BootScreen } from "@/components/shell/boot-screen";
import { useSession } from "@/stores/session";
import { useUi } from "@/stores/ui";
import { Providers } from "./providers";
import { Workspace } from "./workspace";

const subscribe = (cb: () => void) => useSession.persist.onFinishHydration(cb);
const hydrated = () => useSession.persist.hasHydrated();

function Gate() {
  const ready = useSyncExternalStore(subscribe, hydrated, () => false);
  const status = useSession((s) => s.status);
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
  if (!ready) return <BootScreen label="Restoring session…" />;
  return status === "in" ? <Workspace /> : <AuthScreen />;
}

/** Client application root (mounted by `src/app/page.tsx`). */
export function App() {
  return (
    <Providers>
      <Gate />
    </Providers>
  );
}
