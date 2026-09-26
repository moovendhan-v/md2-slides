"use client";

import { useEffect, useState } from "react";
import { typingStep, type TypingState } from "./typing";

/**
 * Types through `script` (each entry is the whole file after one edit), pausing
 * between edits, and loops. Runs only while `active`; `still` shows the final
 * version without animation (reduced motion).
 */
export function useTypingDemo(script: string[], active: boolean, still: boolean): TypingState & { step: number } {
  const final = script.at(-1)!;
  const [state, setState] = useState<TypingState & { step: number }>({ text: still ? final : "", caret: still ? final.length : 0, step: 0 });

  useEffect(() => {
    if (still) {
      // Finished deck, caret at the end so the preview shows the last slide.
      setState({ text: final, caret: final.length, step: script.length - 1 });
      return;
    }
    if (!active) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setState((s) => {
        const target = script[s.step];
        if (s.text === target) {
          // Hold on the finished edit, then move on (restart after the last one).
          const next = (s.step + 1) % script.length;
          timer = setTimeout(tick, next === 0 ? 3200 : 1400);
          return next === 0 ? { text: "", caret: 0, step: 0 } : { ...s, step: next };
        }
        const next = typingStep(s.text, target, 1);
        const deleting = next.text.length < s.text.length;
        timer = setTimeout(tick, deleting ? 12 : 20 + Math.random() * 28);
        return { ...(deleting ? typingStep(s.text, target, 2) : next), step: s.step };
      });
    };
    timer = setTimeout(tick, 400);
    return () => clearTimeout(timer);
  }, [script, final, active, still]);

  return state;
}
