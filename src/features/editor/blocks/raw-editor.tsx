"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Auto-growing raw Markdown box. Commits on blur or ⌘/Ctrl+Enter, cancels on
 * Escape. Shared by component edits and whole-slide raw mode.
 */
export function RawEditor({ value, onCommit, onCancel, autoFocus = true, placeholder }: { value: string; onCommit: (v: string) => void; onCancel: () => void; autoFocus?: boolean; placeholder?: string }) {
  const [text, setText] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [text]);

  useEffect(() => {
    if (autoFocus) ref.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  const finish = (commit: boolean) => {
    if (done.current) return;
    done.current = true;
    if (commit && text !== value) onCommit(text);
    else onCancel();
  };

  return (
    <textarea
      ref={ref}
      value={text}
      spellCheck={false}
      placeholder={placeholder}
      aria-label="Raw Markdown"
      onChange={(e) => setText(e.target.value)}
      onFocus={() => (done.current = false)}
      onBlur={() => finish(true)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape") finish(false);
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) finish(true);
      }}
      className="block w-full resize-none overflow-hidden rounded-md border border-blue-500/50 bg-zinc-950 px-3 py-2 font-mono text-[13px] leading-5 text-zinc-100 outline-none"
    />
  );
}
