import { memo } from "react";
import type { Look } from "@/domain/deck/look";
import { rich } from "@/domain/deck/rich";
import { Icon } from "@/components/common/icon";

/** Renders inline Markdown (bold, marks, code, links, :icons:). */
export const RichText = memo(function RichText({ text, look }: { text?: string; look: Look }) {
  return (
    <>
      {rich(text, look).map((s, i) =>
        s.kind === "icon" ? (
          <Icon key={i} name={s.icon} style={{ color: s.color, verticalAlign: "-.1em" }} />
        ) : (
          <span key={i} style={s.style}>
            {s.t}
          </span>
        ),
      )}
    </>
  );
});
