"use client";

import { useEffect, useState } from "react";
import { BootScreen } from "@/components/shell/boot-screen";
import { ShareGate } from "@/player/share-gate";

/** `/v#<payload>`: the deck comes from the URL fragment, which never reaches the server. */
export function ShareViewer() {
  const [encoded, setEncoded] = useState<string | null>(null);
  useEffect(() => {
    const read = () => setEncoded(location.hash.slice(1));
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  if (encoded == null) return <BootScreen label="Opening shared deck…" />;
  return <ShareGate key={encoded} encoded={encoded} />;
}
