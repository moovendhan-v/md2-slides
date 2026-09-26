/**
 * Pure typing maths for the live demo: move `current` one step toward
 * `target` the way a person edits — keep the common prefix and suffix,
 * delete the changed middle, then type the new middle.
 */
export interface TypingState {
  text: string;
  /** Caret offset (where the edit is happening). */
  caret: number;
}

export function typingStep(current: string, target: string, chars = 1): TypingState {
  if (current === target) return { text: current, caret: current.length };
  let pre = 0;
  while (pre < current.length && pre < target.length && current[pre] === target[pre]) pre++;
  let suf = 0;
  while (suf < current.length - pre && suf < target.length - pre && current[current.length - 1 - suf] === target[target.length - 1 - suf]) suf++;
  const tail = current.slice(current.length - suf);
  // Still have characters to delete in the changed region.
  if (current.length - suf > pre) {
    const cut = Math.max(pre, current.length - suf - chars);
    return { text: current.slice(0, cut) + tail, caret: cut };
  }
  const add = target.slice(pre, Math.min(target.length - suf, pre + chars));
  return { text: current.slice(0, pre) + add + tail, caret: pre + add.length };
}

/** Line number (0-based) of a caret offset. */
export const lineOf = (text: string, caret: number) => text.slice(0, caret).split("\n").length - 1;
