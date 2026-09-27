"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/common/icon";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDeck } from "@/app-shell/deck-context";
import { useWorkspace, fileKey } from "@/stores/workspace";

const IMAGE_EXTS = /\.(png|jpe?g|svg|webp|gif|avif|ico)$/i;

export function RepoImagePicker({ onSelect }: { onSelect: (dataUrlOrPath: string, path: string) => void }) {
  const { repo } = useDeck();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loadingPath, setLoadingPath] = useState<string | null>(null);

  const paths = useWorkspace((s) => s.paths[repo] ?? []);
  const files = useWorkspace((s) => s.files);

  const imagePaths = useMemo(() => {
    return paths.filter((p) => IMAGE_EXTS.test(p));
  }, [paths]);

  const filtered = useMemo(() => {
    if (!search.trim()) return imagePaths;
    const q = search.toLowerCase();
    return imagePaths.filter((p) => p.toLowerCase().includes(q));
  }, [imagePaths, search]);

  const handlePick = async (path: string) => {
    setLoadingPath(path);
    try {
      const key = fileKey(repo, path);
      let content = files[key];

      if (!content || !content.startsWith("data:image/")) {
        // 1. Try fetching via API route
        try {
          const res = await fetch(`/api/github/file?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}&format=dataurl`);
          if (res.ok) {
            const data = await res.json().catch(() => null);
            if (data?.dataUrl) {
              content = data.dataUrl;
            }
          }
        } catch {}

        // 2. If API didn't return dataUrl, try CDN and convert to Base64 blob
        if (!content || !content.startsWith("data:image/")) {
          try {
            const cdnRes = await fetch(`https://cdn.jsdelivr.net/gh/${repo}@main/${path}`);
            if (cdnRes.ok) {
              const blob = await cdnRes.blob();
              content = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            }
          } catch {}
        }

        // Cache Base64 in workspace store if retrieved
        if (content && content.startsWith("data:image/")) {
          useWorkspace.setState((s) => ({
            files: { ...s.files, [key]: content },
          }));
        } else if (!content) {
          content = `https://cdn.jsdelivr.net/gh/${repo}@main/${path}`;
        }
      }

      onSelect(content, path);
      toast.success(`Applied ${path.split("/").pop()} as Base64`);
      setOpen(false);
    } catch {
      const fallbackUrl = `https://cdn.jsdelivr.net/gh/${repo}@main/${path}`;
      onSelect(fallbackUrl, path);
      toast.success(`Applied ${path.split("/").pop()}`);
      setOpen(false);
    } finally {
      setLoadingPath(null);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-8 items-center gap-1.5 rounded-md border border-zinc-800 px-2.5 text-xs text-zinc-300 hover:bg-zinc-900"
          title="Choose an image from current repository"
        >
          <Icon name="folder-simple" className="text-blue-400" />
          <span>From Repo</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 border-zinc-800 bg-zinc-950 p-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
          <div className="flex items-center gap-2">
            <Icon name="images" className="text-blue-400" />
            <span className="text-xs font-semibold text-zinc-100">Repository Images</span>
          </div>
          <span className="font-mono text-[10px] text-zinc-500">{imagePaths.length} found</span>
        </div>

        {imagePaths.length > 5 && (
          <div className="mt-2">
            <input
              type="text"
              placeholder="Search images…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 w-full rounded border border-zinc-800 bg-zinc-900 px-2 text-xs text-zinc-200 outline-none focus:border-zinc-600"
            />
          </div>
        )}

        <div className="mt-2.5 max-h-56 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-500">
              {imagePaths.length === 0
                ? "No images in this repo yet. Use 'Upload' to add images."
                : "No matching images found."}
            </div>
          ) : (
            filtered.map((p) => {
              const name = p.split("/").pop() ?? p;
              const isLoading = loadingPath === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePick(p)}
                  disabled={isLoading}
                  className="flex w-full items-center gap-2.5 rounded-md p-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50 transition-colors"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded bg-zinc-900 border border-zinc-800">
                    <Icon name="image" className="text-zinc-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{name}</div>
                    <div className="truncate font-mono text-[10px] text-zinc-500">{p}</div>
                  </div>
                  {isLoading && <span className="text-[10px] text-blue-400">Loading…</span>}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
