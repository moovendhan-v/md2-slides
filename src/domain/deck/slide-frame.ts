import type { Slide } from "@/engine/types";
import { ANIMS, MEDIA_LAYOUTS } from "./constants";
import type { Look } from "./look";
import { blockCount } from "./queries";

/** Pure layout computation for one slide (no React). */

export interface MediaFrame {
  left: string;
  top: string;
  width: string;
  height: string;
  clip: string;
  radius: string;
  src: string;
  fit: string;
  pos: string;
  flip: string;
  filter: string;
  tint: string;
  shade: string | null;
  alt: string;
  stripe: { left: string; width: string; clip: string } | null;
}

export interface SlideFrame {
  layout: string;
  customId: string | null;
  bg: string;
  fg: string;
  titleColor: string;
  pad: string;
  zoom: number;
  justify: string;
  align: string;
  textAlign: "left" | "center" | "right";
  titleSize: string;
  titleMax: string;
  media: MediaFrame | null;
  anim: string;
  stagger: number;
}

const URLISH = /^(https?:|\.|\/|data:|blob:)/;

const FILTERS: Record<string, string> = {
  grayscale: "grayscale(1)", sepia: "sepia(.8)", blur: "blur(.5cqw)",
  bright: "brightness(1.2) saturate(1.2)", dim: "brightness(.7)", duotone: "grayscale(1) contrast(1.1)",
};

function mediaFrame(lay: string, dir: Record<string, string>, look: Look): MediaFrame {
  const W = Math.min(70, Math.max(20, +dir.mw || 0)) || 44;
  const boxes: Record<string, [string, string, string, string, string, string]> = {
    "image-left": ["0", "0", W + "%", "100%", "none", "0"],
    "image-right": [100 - W + "%", "0", W + "%", "100%", "none", "0"],
    "image-full": ["0", "0", "100%", "100%", "none", "0"],
    "image-top": ["0", "0", "100%", "46%", "none", "0"],
    diagonal: ["46%", "0", "54%", "100%", "polygon(22% 0,100% 0,100% 100%,0 100%)", "0"],
    circle: ["58%", "calc(50% - 17cqw)", "34cqw", "34cqw", "none", "50%"],
    arch: ["58%", "12%", "34%", "88%", "none", "17cqw 17cqw 0 0"],
  };
  const [left, top, width, height, clip, r] = boxes[lay];
  const shaded = lay === "image-full" || +dir.shade > 0;
  const stripe =
    lay === "diagonal" ? { left: "43%", width: "14%", clip: "polygon(52% 0,78% 0,26% 100%,0 100%)" }
    : lay === "image-left" ? { left: W - 1.4 + "%", width: "1.4%", clip: "none" }
    : lay === "image-right" ? { left: 100 - W + "%", width: "1.4%", clip: "none" }
    : null;
  return {
    left, top, width, height, clip,
    radius: dir.mr != null ? dir.mr + "cqw" : r,
    src: dir.image && URLISH.test(dir.image) ? dir.image : "",
    fit: dir.fit || "cover",
    pos: dir.pos || "center",
    flip: dir.flip === "true" ? "scaleX(-1)" : "none",
    filter: FILTERS[dir.filter] || "none",
    tint: dir.filter === "duotone" ? look.accent : "transparent",
    shade: shaded ? `rgba(0,0,0,${dir.shade != null ? +dir.shade : 0.6})` : null,
    alt: dir.caption || "Add image: <!-- image: https://… -->",
    stripe,
  };
}

function mediaPad(lay: string, dir: Record<string, string>): string | undefined {
  const MW = Math.min(70, Math.max(20, +dir.mw || 0)) || 44;
  return {
    "image-left": `5.6cqw 6.4cqw 5.6cqw ${MW + 6}cqw`,
    "image-right": `5.6cqw ${MW + 6}cqw 5.6cqw 6.4cqw`,
    diagonal: "5.6cqw 52cqw 5.6cqw 6.4cqw",
    circle: "5.6cqw 46cqw 5.6cqw 6.4cqw",
    arch: "5.6cqw 46cqw 5.6cqw 6.4cqw",
    "image-top": "28cqw 6.4cqw 4cqw 6.4cqw",
  }[lay];
}

export function slideFrame(sl: Slide, idx: number, look: Look, animate: boolean): SlideFrame {
  const dir = sl.dir || {};
  const nb = blockCount(sl);
  const lay = sl.layout || (!nb ? (idx === 0 ? "center" : "statement") : "left");
  const isMedia = MEDIA_LAYOUTS.includes(lay);
  const center = lay === "center";
  const multi = sl.groups.filter((g) => g.length).length > 1;
  const full = lay === "image-full";
  const bg = dir.bg ? (/^(https?:|\.|\/)/.test(dir.bg) ? `linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)), url(${dir.bg}) center/cover` : dir.bg) : look.bgCss;
  const base = !nb ? (lay === "statement" ? 5.6 : 6.6) : nb > 2 || multi ? 3.4 : 4.2;
  const anim = animate ? dir.animate || look.anim : "none";
  return {
    layout: lay,
    customId: lay.startsWith("custom:") ? lay.slice(7) : null,
    bg,
    fg: dir.color || (full ? "#fafafa" : look.fg),
    titleColor: dir.titleColor || dir.color || (full ? "#fafafa" : look.fg),
    pad: dir.pad ? dir.pad.split(/\s+/).map((x) => x + "cqw").join(" ") : mediaPad(lay, dir) || look.pad,
    zoom: +dir.zoom || 1,
    justify: nb && !isMedia ? "flex-start" : "center",
    align: dir.align === "right" ? "flex-end" : dir.align === "center" || center ? "center" : "flex-start",
    textAlign: (dir.align as SlideFrame["textAlign"]) || (center ? "center" : "left"),
    titleSize: dir.titleSize ? dir.titleSize + "cqw" : (base * look.titleScale).toFixed(2) + "cqw",
    titleMax: nb ? "100%" : "86%",
    media: isMedia ? mediaFrame(lay, dir, look) : null,
    anim: (ANIMS as readonly string[]).includes(anim) ? anim : "none",
    stagger: +dir.stagger || look.stagger,
  };
}

/** CSS animation value for the i-th animated element of a slide. */
export const animCss = (name: string, i: number, stagger: number) =>
  !name || name === "none" ? "none" : `m2s-${name} .6s cubic-bezier(.2,.7,.2,1) ${i * stagger}ms both`;

/** CSS animation for a slide transition. */
export const transitionCss = (name: string | undefined, dur = ".6s") =>
  name && name !== "none" && name !== "inherit" ? `tr-${name} ${dur} cubic-bezier(.2,.7,.2,1) both` : "none";
