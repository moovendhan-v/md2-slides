"use client";

import { useEffect, useState } from "react";
import { changedLines, keyDelay, typingStep, type TypingState } from "./typing";

export type TypingPhase = "typing" | "deleting" | "holding";

export interface TypingDemo extends TypingState {
  step: number;
  phase: TypingPhase;
  /** Lines just finished by the last edit, for the highlight flash (`id` changes per edit). */
  flash: { from: number; to: number; id: number } | null;
}

const START = 900;
const HOLD = 3000;
const RESTART = 5000;
const DELETE = 28;

/**
 * Plays `script` as a sequence of edits at a readable, human pace: type each
 * version, hold so the preview can be read, then move on (loops). The state
 * machine lives in the effect so timers are scheduled exactly once per tick.
 */
export function useTypingDemo(script: string[], active: boolean, still: boolean): TypingDemo {
  const final = script.at(-1)!;
  const [state, setState] = useState<TypingDemo>({ text: still ? final : "", caret: still ? final.length : 0, step: 0, phase: "typing", flash: null });
  useEffect(() => {
    if (still) {
      setState({ text: final, caret: final.length, step: script.length - 1, phase: "holding", flash: null });
      return;
    }
    if (!active) return;
    let s: TypingDemo = { text: "", caret: 0, step: 0, phase: "typing", flash: null };
    let edits = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const target = script[s.step];
      let wait: number;
      if (s.text !== target) {
        const moved = typingStep(s.text, target, 1);
        const deleting = moved.text.length < s.text.length;
        wait = deleting ? DELETE : keyDelay(moved.text[moved.caret - 1]);
        s = { ...s, ...moved, phase: deleting ? "deleting" : "typing" };
      } else if (s.phase !== "holding") {
        // Edit finished: flash the changed lines and hold so the slide can be read.
        const r = changedLines(s.step === 0 ? "" : script[s.step - 1], target);
        wait = s.step === script.length - 1 ? RESTART : HOLD;
        s = { ...s, phase: "holding", flash: r ? { from: r[0], to: r[1], id: ++edits } : null };
      } else {
        const next = (s.step + 1) % script.length;
        wait = 0;
        s = next === 0 ? { text: "", caret: 0, step: 0, phase: "typing", flash: null } : { ...s, step: next, phase: "typing", flash: null };
      }
      setState(s);
      timer = setTimeout(tick, wait);
    };
    // Resume from what is on screen when scrolled back into view.
    setState((cur) => (s = cur));
    timer = setTimeout(tick, START);
    return () => clearTimeout(timer);
  }, [script, final, active, still]);
  return state;
}
