"use client";

import type { ReactNode } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";

export interface SegOption<T extends string | number> {
  id: T;
  label: ReactNode;
  icon?: string;
}

/** Segmented control used across the customizer, dialogs and presenter. */
export function Seg<T extends string | number>({ options, value, onChange, className, size = "md", pill }: {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  size?: "sm" | "md";
  pill?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap gap-0.5", !pill && "rounded-lg bg-zinc-900/60 p-0.5 ring-1 ring-zinc-800", className)}>
      {options.map((o) => {
        const on = String(o.id) === String(value);
        return (
          <button
            key={String(o.id)}
            type="button"
            onClick={() => onChange(o.id)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap transition-colors",
              size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-[13px]",
              pill ? "flex-none rounded-full ring-1" : "rounded-md",
              pill ? (on ? "bg-zinc-50 text-zinc-950 ring-zinc-50" : "text-zinc-400 ring-zinc-800 hover:text-zinc-100") : on ? "bg-zinc-800 text-zinc-50" : "text-zinc-400 hover:text-zinc-100",
            )}
          >
            {o.icon && <Icon name={o.icon} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function ToggleRow({ label, sub, checked, onChange, icon }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void; icon?: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 ring-1 ring-zinc-800 hover:bg-zinc-900/60">
      {icon && <Icon name={icon} className="text-base text-zinc-400" />}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[13px] text-zinc-100">{label}</span>
        {sub && <span className="text-xs text-zinc-500">{sub}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

export function SliderRow({ label, value, min, max, step, display, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="font-mono text-zinc-300">{display ?? value}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}

export function Section({ title, hint, children, className }: { title: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-2.5", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-[13px] font-medium text-zinc-200">{title}</h4>
        {hint && <span className="text-[11px] text-zinc-500">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

/** Round colour chip with an active ring. */
export function Swatch({ color, css, active, onClick, title, round = true }: { color?: string; css?: string; active: boolean; onClick: () => void; title?: string; round?: boolean }) {
  return (
    <button
      type="button"
      title={title ?? color}
      onClick={onClick}
      className={cn("size-7 shrink-0 transition-transform hover:scale-110", round ? "rounded-full" : "rounded-md")}
      style={{ background: css ?? color, boxShadow: active ? `0 0 0 2px #09090b, 0 0 0 4px ${color ?? "#fafafa"}` : "inset 0 0 0 1px #3f3f46" }}
    />
  );
}

/** Small option chip (variants, transitions, filters). */
export function Chip({ active, onClick, onMouseEnter, children, className }: { active: boolean; onClick: () => void; onMouseEnter?: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        "h-7 rounded-md px-2.5 text-xs ring-1 transition-colors",
        active ? "bg-zinc-900 text-zinc-50 ring-zinc-50" : "text-zinc-400 ring-zinc-800 hover:text-zinc-100 hover:ring-zinc-600",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">{children}</kbd>;
}
