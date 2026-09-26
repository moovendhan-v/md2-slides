"use client";

import { createColumnHelper, createSortedRowModel, rowSortingFeature, tableFeatures, useTable } from "@tanstack/react-table";
import { useMemo } from "react";
import { useEngine } from "@/engine/provider";
import { Icon } from "@/components/common/icon";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDeck } from "@/app-shell/deck-context";
import { useFileActions } from "@/hooks/use-file-actions";
import { cn } from "@/lib/utils";
import { useUi } from "@/stores/ui";
import { fileKey, useWorkspace } from "@/stores/workspace";

type Status = "Synced" | "Modified" | "New";

interface DeckRow {
  key: string;
  dir: string;
  name: string;
  title: string;
  slides: number;
  status: Status;
}

const STATUS_COLOR: Record<Status, string> = { Synced: "text-zinc-500", New: "text-green-400", Modified: "text-amber-400" };
const features = tableFeatures({ rowSortingFeature, sortedRowModel: createSortedRowModel() });
const col = createColumnHelper<typeof features, DeckRow>();
const columns = col.columns([
  col.accessor("name", {
    header: "File",
    cell: (c) => (
      <span className="flex items-center gap-2">
        <Icon name="file-md" className="text-blue-400" />
        <span className="text-zinc-500">{c.row.original.dir}</span>
        <span className="font-medium text-zinc-50">{c.getValue()}</span>
      </span>
    ),
  }),
  col.accessor("title", { header: "First slide", cell: (c) => <span className="text-zinc-300">{c.getValue()}</span> }),
  col.accessor("slides", { header: "Slides", cell: (c) => <span className="text-zinc-300">{c.getValue()}</span> }),
  col.accessor("status", { header: "Status", cell: (c) => <span className={cn("text-xs", STATUS_COLOR[c.getValue()])}>{c.getValue()}</span> }),
]);

export function RepoView() {
  const engine = useEngine();
  const { repo: activeRepo } = useDeck();
  const repoView = useUi((s) => s.repoView) ?? activeRepo;
  const setView = useUi((s) => s.setView);
  const repos = useWorkspace((s) => s.repos);
  const paths = useWorkspace((s) => s.paths);
  const files = useWorkspace((s) => s.files);
  const orig = useWorkspace((s) => s.orig);
  const { openFile, newDeck } = useFileActions();
  const repo = repos.find((r) => r.id === repoView) ?? repos[0];
  const all = useMemo(() => paths[repo.id] ?? [], [paths, repo.id]);

  const rows = useMemo<DeckRow[]>(
    () =>
      all
        .filter((p) => p.endsWith(".md"))
        .map((p) => {
          const key = fileKey(repo.id, p);
          const deck = engine.parse(files[key] ?? "");
          return {
            key,
            dir: p.includes("/") ? p.slice(0, p.lastIndexOf("/") + 1) : "",
            name: p.split("/").pop() ?? p,
            title: deck.meta.title || deck.slides[0]?.title || "—",
            slides: deck.slides.length,
            status: orig[key] == null ? "New" : files[key] !== orig[key] ? "Modified" : "Synced",
          };
        }),
    [all, repo.id, files, orig, engine],
  );
  const table = useTable({ features, columns, data: rows });
  const hidden = all.length - rows.length;

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="flex items-center gap-2 text-[13px] text-zinc-300">
              <Icon name="github-logo" className="text-base" />
              {repo.id}
              <span className="rounded-full border border-zinc-700 px-2 py-px text-[10px] text-zinc-400">{repo.private ? "Private" : "Public"}</span>
            </span>
            <h1 className="text-2xl font-semibold tracking-tight">{repo.id.split("/")[1]}</h1>
            <p className="text-[13px] text-zinc-500">
              {rows.length} Markdown decks · branch {repo.branch} · updated {repo.updated}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-1.5 border-zinc-800" onClick={newDeck}>
              <Icon name="plus" /> New deck
            </Button>
            <Button className="gap-1.5 bg-zinc-50 font-semibold text-zinc-950 hover:bg-zinc-200" onClick={() => setView("templates")}>
              <Icon name="squares-four" /> From template
            </Button>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="border-zinc-800 hover:bg-transparent">
                  {hg.headers.map((h) => (
                    <TableHead key={h.id} className="h-9 cursor-pointer text-xs font-normal text-zinc-500 select-none" onClick={h.column.getToggleSortingHandler()}>
                      <table.FlexRender header={h} />
                      {{ asc: " ↑", desc: " ↓" }[h.column.getIsSorted() as string] ?? ""}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="h-11 cursor-pointer border-zinc-800 hover:bg-zinc-900/60" onClick={() => openFile(row.original.key)}>
                  {row.getAllCells().map((c) => (
                    <TableCell key={c.id} className="text-[13px]">
                      <table.FlexRender cell={c} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {hidden > 0 && (
          <p className="flex items-center gap-2 text-xs text-zinc-500">
            <Icon name="info" /> {hidden} non-Markdown file{hidden > 1 ? "s" : ""} hidden (assets, config)
          </p>
        )}
      </div>
    </div>
  );
}
