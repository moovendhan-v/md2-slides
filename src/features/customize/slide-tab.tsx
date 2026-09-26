"use client";

import { useDeck } from "@/app-shell/deck-context";
import { Section, Seg, SliderRow, Swatch } from "@/components/common/controls";
import { Icon } from "@/components/common/icon";
import { Input } from "@/components/ui/input";
import { useDeckActions } from "@/hooks/use-deck-actions";
import { LayoutSection } from "./slide-layout-section";

const BGS = ["#09090b", "#18181b", "#0b1120", "#1e1b4b", "#052e16", "#fafafa", "#f5f5f4", "#fef3c7"];
const GRADIENTS = [
  "linear-gradient(135deg,#1e3a8a,#09090b)",
  "linear-gradient(135deg,#7c3aed,#db2777)",
  "linear-gradient(160deg,#0f766e,#022c22)",
  "radial-gradient(circle at 30% 20%,#f97316,#1c1917 70%)",
];
const TEXT = ["#fafafa", "#e4e4e7", "#09090b", "#fbbf24", "#60a5fa", "#f472b6"];
const DEFAULT_CSS = "repeating-linear-gradient(45deg,#27272a 0 4px,#3f3f46 4px 8px)";

/** Per-slide overrides written as a `<!-- key: value -->` directive. */
export function SlideTab() {
  const { deck, current, look } = useDeck();
  const actions = useDeckActions();
  const dir = deck.slides[current]?.dir ?? {};
  const pad = (dir.pad || "").split(/\s+/).map(Number);
  const rows: [string, string, string[]][] = [
    ["Background", "bg", [...BGS, ...GRADIENTS]],
    ["Text color", "color", TEXT],
    ["Title color", "titleColor", [...TEXT, look.accent]],
    ["Accent (this slide)", "accent", ["#60a5fa", "#a78bfa", "#f472b6", "#4ade80", "#fbbf24"]],
  ];
  return (
    <>
      <p className="flex items-center gap-1.5 text-[11px] text-zinc-500">
        <Icon name="info" /> Editing slide {current + 1} — move the caret to pick another.
      </p>
      <LayoutSection />
      {rows.map(([label, key, list]) => (
        <Section key={key} title={label}>
          <div className="flex flex-wrap gap-2">
            <Swatch title="Theme default" css={DEFAULT_CSS} active={!dir[key]} onClick={() => actions.setDirective(key, null)} round={false} />
            {list.map((c) => (
              <Swatch key={c} css={c} color={c.startsWith("#") ? c : undefined} active={dir[key] === c} onClick={() => actions.setDirective(key, c)} round={false} />
            ))}
            <label className="relative size-7 cursor-pointer overflow-hidden rounded-md ring-1 ring-zinc-700" title="Custom colour">
              <span className="absolute inset-0" style={{ background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)" }} />
              <input type="color" value={/^#/.test(dir[key] || "") ? dir[key] : "#000000"} onChange={(e) => actions.setDirective(key, e.target.value)} className="absolute inset-0 opacity-0" />
            </label>
          </div>
        </Section>
      ))}
      <Section title="Background image URL">
        <Input
          key={current}
          defaultValue={/^(https?:|\.|\/)/.test(dir.bg || "") ? dir.bg : ""}
          placeholder="https://…/photo.jpg (darkened automatically)"
          onChange={(e) => actions.setDirective("bg", e.target.value)}
          className="h-8 border-zinc-800 text-xs"
        />
      </Section>
      <Section title="Alignment">
        <Seg size="sm" value={dir.align || ""} onChange={(v) => actions.setDirective("align", v)} options={[["", "Auto"], ["left", "Left"], ["center", "Center"], ["right", "Right"]].map(([id, label]) => ({ id, label }))} />
      </Section>
      <SliderRow label="Content zoom" value={+(dir.zoom || 1)} min={0.5} max={1.4} step={0.05} display={`${dir.zoom || 1}×`} onChange={(v) => actions.setDirective("zoom", String(v))} />
      <SliderRow label="Title size" value={+(dir.titleSize || 4.2)} min={2} max={10} step={0.2} display={dir.titleSize ? `${dir.titleSize}cqw` : "auto"} onChange={(v) => actions.setDirective("titleSize", String(v))} />
      <SliderRow label="Padding vertical" value={pad[0] || 5.6} min={1} max={12} step={0.2} display={dir.pad ? `${pad[0]}cqw` : "auto"} onChange={(v) => actions.setDirective("pad", `${v} ${pad[1] || 6.4}`)} />
      <SliderRow label="Padding horizontal" value={pad[1] || 6.4} min={1} max={14} step={0.2} display={dir.pad ? `${pad[1] || pad[0]}cqw` : "auto"} onChange={(v) => actions.setDirective("pad", `${pad[0] || 5.6} ${v}`)} />
      <button type="button" onClick={actions.resetSlide} className="flex items-center gap-1.5 self-start text-xs text-zinc-400 hover:text-zinc-100">
        <Icon name="arrow-counter-clockwise" /> Reset slide overrides
      </button>
    </>
  );
}
