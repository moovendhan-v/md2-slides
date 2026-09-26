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
    const onResize = () => useUi.getState().set({ width: window.innerWidth });
    onResize();
    const w = window.innerWidth;
    useUi.getState().set({ sidebarOpen: w > 760, customOpen: w > 1200 });
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
