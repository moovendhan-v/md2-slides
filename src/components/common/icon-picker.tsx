"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ICON_CATEGORIES, loadIconCatalog } from "@/domain/icons/catalog";
import { searchIcons, type IconInfo } from "@/domain/icons/search";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";

const PAGE = 240;

function useIconCatalog(active: boolean) {
  const [icons, setIcons] = useState<IconInfo[] | null>(null);
  useEffect(() => {
    if (active && !icons) void loadIconCatalog().then(setIcons);
  }, [active, icons]);
  return icons;
}

/** Searchable grid of every icon in the catalog, previewed with the slide icon font. */
function IconGrid({ value, onSelect }: { value?: string; onSelect: (name: string) => void }) {
  const icons = useIconCatalog(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | undefined>();
  const [limit, setLimit] = useState(PAGE);
  const [hover, setHover] = useState<string | undefined>(value);
  const results = useMemo(() => (icons ? searchIcons(icons, q, cat) : []), [icons, q, cat]);
  const shown = hover ?? results[0]?.name;

  return (
    <div className="flex w-[min(420px,calc(100vw-24px))] flex-col gap-2">
      <div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-2">
        <Icon name="magnifying-glass" className="text-zinc-500" />
        <input
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setLimit(PAGE);
          }}
          onKeyDown={(e) => e.key === "Enter" && results[0] && onSelect(results[0].name)}
          placeholder={icons ? `Search ${icons.length} icons (name or tag)…` : "Loading icons…"}
          aria-label="Search icons"
          className="h-8 min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-zinc-600"
        />
      </div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {[undefined, ...ICON_CATEGORIES].map((c) => (
          <button
            key={c ?? "all"}
            type="button"
            onClick={() => {
              setCat(c);
              setLimit(PAGE);
            }}
            className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[11px] capitalize", cat === c ? "border-blue-500 bg-blue-500/15 text-zinc-50" : "border-zinc-800 text-zinc-400 hover:text-zinc-200")}
          >
            {c ?? "all"}
          </button>
        ))}
      </div>
      <div className="grid max-h-64 grid-cols-8 gap-1 overflow-y-auto pr-1" role="listbox" aria-label="Icons">
        {results.slice(0, limit).map((i) => (
          <button
            key={i.name}
            type="button"
            role="option"
            aria-selected={i.name === value}
            title={i.name}
            onClick={() => onSelect(i.name)}
            onMouseEnter={() => setHover(i.name)}
            onFocus={() => setHover(i.name)}
            className={cn("grid aspect-square place-items-center rounded-md text-xl text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50", i.name === value && "bg-blue-500/20 text-blue-200 ring-1 ring-blue-500")}
          >
            <Icon name={i.name} />
          </button>
        ))}
        {icons && !results.length && <p className="col-span-8 py-6 text-center text-xs text-zinc-500">No icons match “{q}”</p>}
      </div>
      {results.length > limit && (
        <button type="button" onClick={() => setLimit(limit + PAGE)} className="text-xs text-blue-400 hover:text-blue-300">
          Show more ({results.length - limit} left)
        </button>
      )}
      <div className="flex h-12 items-center gap-3 border-t border-zinc-800 pt-2">
        {shown && (
          <>
            <span className="grid size-10 place-items-center rounded-lg bg-zinc-900 text-2xl text-zinc-50">
              <Icon name={shown} />
            </span>
            <div className="min-w-0">
              <div className="truncate font-mono text-xs text-zinc-200">{shown}</div>
              <div className="font-mono text-[10px] text-zinc-500">
                inline: :{shown}: · rows: - {shown} | Title
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Popover icon picker: wraps a trigger and calls `onSelect` with the chosen icon name. */
export function IconPicker({
  value,
  onSelect,
  children,
  align = "start",
  open: controlled,
  onOpenChange,
}: {
  value?: string;
  onSelect: (name: string) => void;
  children: ReactNode;
  align?: "start" | "center" | "end";
  /** Optional controlled open state (e.g. opened from a command). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [own, setOwn] = useState(false);
  const open = controlled ?? own;
  const setOpen = (o: boolean) => (onOpenChange ? onOpenChange(o) : setOwn(o));
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} className="w-auto border-zinc-800 bg-zinc-950 p-3">
        {open && (
          <IconGrid
            value={value}
            onSelect={(name) => {
              onSelect(name);
              setOpen(false);
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
