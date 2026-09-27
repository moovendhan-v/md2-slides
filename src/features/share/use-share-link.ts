"use client";

import { useEffect, useState } from "react";
import { useDeck } from "@/app-shell/deck-context";
import { resolveRelative } from "@/domain/deck/queries";
import { encodeShare, linkHealth } from "@/domain/share/codec";
import { collectAssets, collectImports, expiresAt, relativeImages, type SharePayload } from "@/domain/share/payload";
import type { ShareSettings } from "@/stores/session";
import { fileKey, useWorkspace } from "@/stores/workspace";

export interface ShareLink {
  url: string;
  bytes: number;
  health: ReturnType<typeof linkHealth>;
  /** Relative images that exist only in the repo and were not bundled. */
  missingImages: string[];
  payload: SharePayload;
}

/** Build the payload for the active deck (imports and assets resolved from loaded files). */
export function buildPayload(deck: { src: string; path: string; repo: string }, s: ShareSettings, now = Date.now()): SharePayload {
  const files = useWorkspace.getState().files;
  const imports = collectImports(
    deck.src,
    (ref, kind) => (kind === "src" ? resolveRelative(deck.path, ref) : ref.replace(/^\.?\//, "")),
    (p) => files[fileKey(deck.repo, p)],
  );
  const assets = collectAssets(
    deck.src,
    (ref) => resolveRelative(deck.path, ref),
    (p) => files[fileKey(deck.repo, p)],
  );
  const name = (deck.path.split("/").pop() ?? "deck").replace(/\.md$/, "");
  return {
    v: 1,
    md: deck.src,
    ...(Object.keys(imports).length ? { files: imports } : {}),
    ...(Object.keys(assets).length ? { assets } : {}),
    path: deck.path,
    name,
    created: now,
    expires: expiresAt(s.exp, now),
    opts: { notes: s.notes, download: s.download, present: s.present },
  };
}

/**
 * The view-only link for the active deck, re-encoded when the deck or the
 * options change. Everything happens in the browser: the deck is compressed
 * (and encrypted when a password is set) into the URL fragment.
 */
export function useShareLink(settings: ShareSettings, password: string, enabled: boolean): ShareLink | null {
  const { src, path, repo } = useDeck();
  const [link, setLink] = useState<ShareLink | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const t = setTimeout(async () => {
      const payload = buildPayload({ src, path, repo }, settings);
      const encoded = await encodeShare(payload, password || undefined);
      const url = `${location.origin}/v#${encoded}`;
      if (alive) setLink({ url, bytes: url.length, health: linkHealth(url), missingImages: relativeImages(src), payload });
    }, 150);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [src, path, repo, settings, password, enabled]);
  return link;
}
