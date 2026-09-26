"use client";

import { useEffect } from "react";
import { usePresent } from "@/stores/present";

interface SyncMessage {
  index: number;
  click: number;
  active: boolean;
}

/**
 * Keep presenter position in sync between windows of the same deck (audience
 * + speaker view) over BroadcastChannel. Either window can drive.
 */
export function useSlideSync(channel: string | null) {
  useEffect(() => {
    if (!channel || typeof BroadcastChannel === "undefined") return;
    const bc = new BroadcastChannel(channel);
    // Updates applied from the other window must not be echoed back (they would race newer local moves).
    let remote = false;
    bc.onmessage = (e: MessageEvent<SyncMessage>) => {
      const p = usePresent.getState();
      const m = e.data;
      remote = true;
      try {
        if (m.active && !p.active) p.start(m.index);
        if (m.index !== p.index || m.click !== p.click) p.set({ index: m.index, click: m.click });
      } finally {
        remote = false;
      }
    };
    const off = usePresent.subscribe((s, prev) => {
      if (remote) return;
      if (s.index !== prev.index || s.click !== prev.click || s.active !== prev.active) bc.postMessage({ index: s.index, click: s.click, active: s.active } satisfies SyncMessage);
    });
    return () => {
      off();
      bc.close();
    };
  }, [channel]);
}
