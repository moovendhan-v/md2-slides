"use client";

import { AuthScreen } from "@/features/auth/auth-screen";
import { BootScreen } from "@/components/shell/boot-screen";
import { useMeQuery } from "@/hooks/use-queries";
import { useViewportWidth } from "@/hooks/use-viewport-width";
import { Providers } from "./providers";
import { Workspace } from "./workspace";

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
