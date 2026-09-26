"use client";

import { useEffect, useRef, useState } from "react";

interface DemoState {
  /** Lines currently visible in the editor (the lines revealed so far). */
  lines: string[];
  /** Which script step we are on. */
  step: number;
  /** Index of the line currently being "written" — used for the active-line highlight. */
  activeLine: number;
}

/**
 * Reveals the script line-by-line with a satisfying magic animation feel.
 * Each line pops into the editor one at a time; the preview updates live.
 * Loops forever. Runs only while `active`; `still` shows the final state.
 */
export function useTypingDemo(
  script: string[],
  active: boolean,
  still: boolean,
): { text: string; caret: number; step: number } {
  const allFinalLines = script.at(-1)!.split("\n");

  const [state, setState] = useState<DemoState>(() => {
    if (still) {
      const lines = allFinalLines;
      return { lines, step: script.length - 1, activeLine: lines.length - 1 };
    }
    return { lines: [], step: 0, activeLine: 0 };
  });

  const stateRef = useRef(state);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (still) {
      const lines = allFinalLines;
      const s = { lines, step: script.length - 1, activeLine: lines.length - 1 };
      stateRef.current = s;
      setState(s);
      return;
    }
    if (!active) return;

    const run = () => {
      const s = stateRef.current;
      const targetLines = script[s.step].split("\n");
      const nextLineIdx = s.lines.length;

      if (nextLineIdx < targetLines.length) {
        // Reveal the next line with a short delay for "magic" feel.
        // Blank lines appear faster; content lines get a brief pause.
        const line = targetLines[nextLineIdx];
        const delay = line.trim() === "" ? 80 : 160 + Math.random() * 120;
        const next: DemoState = {
          lines: targetLines.slice(0, nextLineIdx + 1),
          step: s.step,
          activeLine: nextLineIdx,
        };
        stateRef.current = next;
        setState(next);
        timerRef.current = setTimeout(run, delay);
      } else {
        // All lines shown — pause, then advance to next step (or loop).
        const nextStep = (s.step + 1) % script.length;
        const pause = nextStep === 0 ? 3200 : 1600;
        timerRef.current = setTimeout(() => {
          const reset: DemoState = {
            lines: nextStep === 0 ? [] : script[nextStep - 1]?.split("\n") ?? [],
            step: nextStep,
            activeLine: 0,
          };
          stateRef.current = reset;
          setState(reset);
          timerRef.current = setTimeout(run, 400);
        }, pause);
      }
    };

    timerRef.current = setTimeout(run, 600);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [script, active, still]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reconstruct text + caret so the Preview (SlideView) keeps working as-is.
  const text = state.lines.join("\n");
  const caret = text.length;
  return { text, caret, step: state.step };
}
