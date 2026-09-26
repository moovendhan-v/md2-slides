"use client";

import { useEffect, useState } from "react";

/** Whether a GitHub session exists (labels the CTA "Open your decks"). Fails quietly to signed-out. */
export function useSignedIn() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { user?: unknown } | null) => alive && setSignedIn(!!j?.user))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return signedIn;
}
