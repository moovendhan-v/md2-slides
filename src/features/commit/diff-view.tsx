"use client";

import type { Hunk } from "@/domain/source/diff";
import { cn } from "@/lib/utils";

const ROW = {
  ctx: "text-zinc-400",
  add: "bg-green-500/10 text-green-200",
  del: "bg-red-500/10 text-red-200",
} as const;
const SIGN = { ctx: " ", add: "+", del: "-" } as const;

/** Unified, git-style diff: hunk headers, old/new line numbers, +/- rows. */
export function DiffView({ hunks }: { hunks: Hunk[] }) {
  if (!hunks.length) return <p className="px-3 py-2 text-xs text-zinc-500">No line changes (whitespace is normalised on push).</p>;
  return (
    <div className="max-h-80 overflow-auto bg-zinc-950 font-mono text-[12px] leading-5">
      <table className="w-full border-collapse">
        <tbody>
          {hunks.map((h, k) => (
            <HunkRows key={k} hunk={h} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HunkRows({ hunk }: { hunk: Hunk }) {
  return (
    <>
      <tr className="bg-blue-500/10 text-blue-300">
        <td colSpan={3} className="px-3 py-0.5 select-none">{hunk.header}</td>
      </tr>
      {hunk.lines.map((l, i) => (
        <tr key={i} className={ROW[l.op]}>
          <td className="w-10 px-2 text-right text-zinc-600 select-none">{l.a ?? ""}</td>
          <td className="w-10 px-2 text-right text-zinc-600 select-none">{l.b ?? ""}</td>
          <td className="px-2 whitespace-pre">
            <span className={cn("mr-2 select-none", l.op === "add" && "text-green-400", l.op === "del" && "text-red-400")}>{SIGN[l.op]}</span>
            {l.text || " "}
          </td>
        </tr>
      ))}
    </>
  );
}
