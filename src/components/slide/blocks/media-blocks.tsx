"use client";

/* eslint-disable @next/next/no-img-element -- slide media are arbitrary user URLs/blobs */
import type { Block } from "@/engine/types";
import { rowCells } from "@/domain/deck/rows";
import { Icon } from "@/components/common/icon";
import { useBlockEnv } from "../render-context";

const URLISH = /^(https?:|\.|\/|data:|blob:)/;

export function GalleryBlock({ block }: { block: Block }) {
  const { look } = useBlockEnv();
  const s = block.args?.style || "grid";
  const items = (block.rows ?? []).map((r) => {
    const [src, cap] = rowCells(r);
    const ok = URLISH.test(src || "");
    return { src: ok ? src : "", cap: ok ? cap || "" : src || cap || "" };
  });
  const n = items.length;
  const cols = s === "strip" ? n : s === "mosaic" ? 3 : Math.min(n, n === 4 ? 2 : 3);
  return (
    <div
      style={{
        display: "grid", gridTemplateColumns: `repeat(${cols},minmax(0,1fr))`, gridTemplateRows: s === "mosaic" ? "repeat(2,minmax(0,1fr))" : "auto", gap: "1.4cqw",
      }}
    >
      {items.map((g, k) => (
        <div key={k} style={{ display: "flex", flexDirection: "column", gap: ".7cqw", minWidth: 0, gridRow: s === "mosaic" && k === 0 ? "span 2" : "span 1" }}>
          <div
            style={{
              position: "relative", flex: 1, aspectRatio: s === "circles" ? "1 / 1" : s === "strip" ? "3 / 4" : "4 / 3",
              borderRadius: s === "circles" ? "50%" : look.r, overflow: "hidden", background: look.panel, boxShadow: `inset 0 0 0 1px ${look.rule}`,
            }}
          >
            {g.src ? (
              <img src={g.src} alt={g.cap} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: look.muted }}>
                <Icon name="image" style={{ fontSize: "3cqw" }} />
              </div>
            )}
          </div>
          {g.cap && <span style={{ fontSize: "1.3cqw", color: look.muted, textAlign: "center" }}>{g.cap}</span>}
        </div>
      ))}
    </div>
  );
}

export function ImageBlock({ block }: { block: Block }) {
  const { look } = useBlockEnv();
  const a = block.args ?? {};
  const filter = a.filter === "grayscale" ? "grayscale(1)" : a.filter === "blur" ? "blur(.4cqw)" : "none";
  return (
    <div
      style={{
        borderRadius: a.r != null ? +a.r / 10 + "cqw" : look.r, overflow: "hidden", width: (a.w || 100) + "%", height: a.h ? a.h + "cqw" : "auto",
        aspectRatio: a.h ? "auto" : (a.ar || "16 / 9").replace(":", " / "), alignSelf: a.align || "stretch", margin: "0 auto",
        background: look.panel, boxShadow: `inset 0 0 0 1px ${look.rule}`, display: "grid", placeItems: "center",
      }}
    >
      {block.src ? (
        <img src={block.src} alt={block.alt || "Image"} style={{ width: "100%", height: "100%", objectFit: (a.fit as "cover") || "cover", objectPosition: a.pos || "center", filter }} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1cqw", color: look.muted, fontSize: "1.4cqw" }}>
          <Icon name="image" style={{ fontSize: "3.4cqw" }} />
          <span>{block.alt || "Click to add an image"}</span>
        </div>
      )}
    </div>
  );
}
