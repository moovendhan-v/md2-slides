/**
 * Line diff for the commit review (unified, git-style hunks). Common prefix
 * and suffix are trimmed first, then an LCS table runs over the middle; a
 * middle too large for the table falls back to a plain replace.
 */

export type DiffOp = "ctx" | "add" | "del";

export interface DiffLine {
  op: DiffOp;
  text: string;
  /** 1-based line numbers in the old / new file (absent on the other side). */
  a?: number;
  b?: number;
}

export interface Hunk {
  header: string;
  lines: DiffLine[];
}

const MAX_CELLS = 4_000_000;

/** Full line-by-line edit script from `a` to `b`. */
export function diffLines(a: string[], b: string[]): DiffLine[] {
  let pre = 0;
  while (pre < a.length && pre < b.length && a[pre] === b[pre]) pre++;
  let suf = 0;
  while (suf < a.length - pre && suf < b.length - pre && a[a.length - 1 - suf] === b[b.length - 1 - suf]) suf++;
  const A = a.slice(pre, a.length - suf);
  const B = b.slice(pre, b.length - suf);
  const out: DiffLine[] = [];
  const ctx = (i: number, j: number) => out.push({ op: "ctx", text: a[i], a: i + 1, b: j + 1 });
  for (let i = 0; i < pre; i++) ctx(i, i);

  const n = A.length;
  const m = B.length;
  if (n * m > MAX_CELLS) {
    A.forEach((t, i) => out.push({ op: "del", text: t, a: pre + i + 1 }));
    B.forEach((t, j) => out.push({ op: "add", text: t, b: pre + j + 1 }));
  } else {
    // lcs[i][j] = LCS length of A[i..] and B[j..], flattened.
    const w = m + 1;
    const lcs = new Uint32Array((n + 1) * w);
    for (let i = n - 1; i >= 0; i--)
      for (let j = m - 1; j >= 0; j--) lcs[i * w + j] = A[i] === B[j] ? lcs[(i + 1) * w + j + 1] + 1 : Math.max(lcs[(i + 1) * w + j], lcs[i * w + j + 1]);
    let i = 0;
    let j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && A[i] === B[j]) ctx(pre + i++, pre + j++);
      // Deletions before additions, as git prints them.
      else if (i < n && (j === m || lcs[(i + 1) * w + j] >= lcs[i * w + j + 1])) out.push({ op: "del", text: A[i], a: pre + ++i });
      else out.push({ op: "add", text: B[j], b: pre + ++j });
    }
  }
  for (let k = suf; k > 0; k--) ctx(a.length - k, b.length - k);
  return out;
}

/** Group changes into hunks with `context` unchanged lines around them. */
export function toHunks(lines: DiffLine[], context = 3): Hunk[] {
  const keep = new Uint8Array(lines.length);
  lines.forEach((l, i) => {
    if (l.op === "ctx") return;
    for (let k = Math.max(0, i - context); k <= Math.min(lines.length - 1, i + context); k++) keep[k] = 1;
  });
  const hunks: Hunk[] = [];
  const starts: [number, number][] = [];
  let open = false;
  // Lines seen so far on each side, for hunks that start on the other side.
  let seenA = 0;
  let seenB = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!keep[i]) open = false;
    else {
      if (!open) {
        hunks.push({ header: "", lines: [] });
        starts.push([seenA + 1, seenB + 1]);
      }
      open = true;
      hunks[hunks.length - 1].lines.push(l);
    }
    if (l.op !== "add") seenA++;
    if (l.op !== "del") seenB++;
  }
  hunks.forEach((h, k) => {
    const [aStart, bStart] = starts[k];
    const aLen = h.lines.filter((l) => l.op !== "add").length;
    const bLen = h.lines.filter((l) => l.op !== "del").length;
    h.header = `@@ -${aLen ? aStart : aStart - 1},${aLen} +${bLen ? bStart : bStart - 1},${bLen} @@`;
  });
  return hunks;
}

/** Unified diff of two texts; `a` undefined means a new file. */
export function diffText(a: string | undefined, b: string) {
  const lines = diffLines(a == null ? [] : a.split("\n"), b.split("\n"));
  return {
    hunks: toHunks(lines),
    add: lines.filter((l) => l.op === "add").length,
    del: lines.filter((l) => l.op === "del").length,
  };
}
