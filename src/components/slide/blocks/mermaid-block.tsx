"use client";

import { useEffect, useState } from "react";
import type { Block } from "@/engine/types";
import { Icon } from "@/components/common/icon";
import { useBlockEnv } from "../render-context";
import { CodeBlock } from "./code-blocks";
import { renderMermaid } from "../mermaid-render";

/** A ```mermaid fence rendered as a diagram (flowchart, sequence, class, gantt, pie, mindmap …). */
export function MermaidBlock({ block }: { block: Block }) {
  const { look } = useBlockEnv();
  const code = (block.code ?? []).join("\n");
  const [state, setState] = useState<{ svg?: string; error?: string }>({});

  useEffect(() => {
    let alive = true;
    renderMermaid(code, look).then(
      (svg) => alive && setState({ svg }),
      (e: Error) => alive && setState({ error: e.message.split("\n")[0] }),
    );
    return () => {
      alive = false;
    };
  }, [code, look]);

  if (state.error)
    return (
      <div style={{ borderRadius: look.r, background: look.codeBg, boxShadow: `inset 0 0 0 1px ${look.rule}`, padding: "1.6cqw 2cqw", fontFamily: look.mono, fontSize: "1.2cqw", color: look.muted }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".8cqw", color: "#f87171", marginBottom: ".6cqw" }}>
          <Icon name="warning" /> Mermaid error
        </div>
        {state.error}
      </div>
    );
  if (!state.svg) return <div style={{ height: "18cqw", display: "grid", placeItems: "center", color: look.muted, fontSize: "1.3cqw" }}>Rendering diagram…</div>;
  return (
    <div
      className="m2s-mermaid"
      role="img"
      aria-label="Diagram"
      style={{ display: "flex", justifyContent: "center", width: "100%" }}
      // Mermaid runs with securityLevel "strict" (sanitised SVG, no scripts or clicks).
      dangerouslySetInnerHTML={{ __html: state.svg }}
    />
  );
}

/** Registry entry for `code`: Mermaid fences become diagrams, everything else stays a code block. */
export function CodeOrDiagramBlock({ block }: { block: Block }) {
  return block.mermaid ? <MermaidBlock block={block} /> : <CodeBlock block={block} />;
}
