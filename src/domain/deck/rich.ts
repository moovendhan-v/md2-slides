import type { CSSProperties } from "react";

import type { Look } from "./look";

/** Inline-formatted text segment (`**b**`, `==mark==`, `:icon:` …). */
export type RichSeg =
  | { kind: "text"; t: string; style?: CSSProperties }
  | { kind: "icon"; icon: string; color: string };

const INLINE = /(\*\*[^*]+\*\*|==[^=]+==|`[^`]+`|\*[^*\s][^*]*\*|_[^_\s][^_]*_|\[[^\]]+\]\([^)]*\)|:[a-z][a-z0-9-]+:|~~[^~]+~~)/g;

function styled(x: string, look: Look): RichSeg {
  if (x.startsWith("**")) return { kind: "text", t: x.slice(2, -2), style: { fontWeight: 700 } };
  if (x.startsWith("=="))
    return { kind: "text", t: x.slice(2, -2), style: { background: look.chip, color: look.accent, padding: "0 .3em", borderRadius: ".25em" } };
  if (x.startsWith("`"))
    return {
      kind: "text",
      t: x.slice(1, -1),
      style: { fontFamily: look.mono, background: look.codeBg, padding: ".05em .35em", borderRadius: ".3em", color: look.accent },
    };
  if (x.startsWith("~~")) return { kind: "text", t: x.slice(2, -2), style: { textDecoration: "line-through", color: look.muted } };
  if (x.startsWith("[")) {
    const label = x.match(/^\[([^\]]+)\]/)?.[1] ?? x;
    return { kind: "text", t: label, style: { color: look.accent, textDecoration: "underline" } };
  }
  if (x.startsWith(":")) return { kind: "icon", icon: "ph-" + x.slice(1, -1), color: look.accent };
  return { kind: "text", t: x.slice(1, -1), style: { fontStyle: "italic" } };
}

export function rich(t: string | undefined, look: Look): RichSeg[] {
  const s = String(t ?? "");
  const out: RichSeg[] = [];
  let last = 0;
  for (const m of s.matchAll(INLINE)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ kind: "text", t: s.slice(last, at) });
    out.push(styled(m[0], look));
    last = at + m[0].length;
  }
  if (last < s.length) out.push({ kind: "text", t: s.slice(last) });
  return out.length ? out : [{ kind: "text", t: s }];
}

/** Strip inline markers, e.g. for plain labels and table cells. */
export const plain = (t: string) => t.replace(/\*\*/g, "");
