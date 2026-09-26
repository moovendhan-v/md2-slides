"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { EngineProvider } from "@/engine/provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BootScreen } from "@/components/shell/boot-screen";
import { ServicesProvider } from "./services";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } } }));
  return (
    <QueryClientProvider client={client}>
      <TooltipProvider delayDuration={300}>
        <EngineProvider fallback={<BootScreen label="Loading slide engine…" />}>
          <ServicesProvider>{children}</ServicesProvider>
        </EngineProvider>
        <Toaster theme="dark" position="bottom-center" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
