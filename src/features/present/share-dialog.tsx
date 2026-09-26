"use client";

import { toast } from "sonner";
import { useDeck } from "@/app-shell/deck-context";
import { Seg, ToggleRow } from "@/components/common/controls";
import { Icon } from "@/components/common/icon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSession, type ShareSettings } from "@/stores/session";
import { useUi } from "@/stores/ui";

const EXPIRY: Record<ShareSettings["exp"], string> = { "1h": "in 1 hour", "24h": "in 24 hours", "7d": "in 7 days", talk: "when you exit presenting" };

/** Live share link settings for the current presentation. */
export function ShareDialog() {
  const open = useUi((s) => s.modal === "share");
  const close = useUi((s) => s.closeModal);
  const { path } = useDeck();
  const sh = useSession((s) => s.share);
  const setShare = useSession((s) => s.setShare);
  const slug = (path.split("/").pop() ?? "deck").replace(/\.md$/, "");
  const url = `https://slidewise.app/p/${slug}-${sh.tok}${sh.follow ? "?live=1" : ""}`;
  const toggles: [keyof ShareSettings, string, string][] = [
    ["follow", "Follow presenter", "Viewers jump to your current slide"],
    ["notes", "Show speaker notes", "Viewers can read notes"],
    ["dl", "Allow download", "PDF + .md export"],
    ["qa", "Live reactions & Q&A", "Viewers can send questions"],
  ];
  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="border-zinc-800 bg-zinc-950 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share live presentation</DialogTitle>
          <DialogDescription>
            Link expires {EXPIRY[sh.exp]} · 0 viewers
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input readOnly value={url} className="h-9 border-zinc-800 font-mono text-xs" />
          <Button
            className="h-9 gap-1.5 bg-zinc-50 text-zinc-950 hover:bg-zinc-200"
            onClick={() => {
              navigator.clipboard?.writeText(url).catch(() => undefined);
              toast("Link copied");
            }}
          >
            <Icon name="copy" /> Copy
          </Button>
          <Button variant="outline" size="icon" className="size-9 border-zinc-800" title="Regenerate link" onClick={() => setShare({ tok: Math.random().toString(36).slice(2, 8) })}>
            <Icon name="arrows-clockwise" />
          </Button>
        </div>
        <div className="flex flex-col gap-2 text-xs text-zinc-400">
          Expires
          <Seg size="sm" value={sh.exp} onChange={(exp) => setShare({ exp })} options={(Object.keys(EXPIRY) as ShareSettings["exp"][]).map((id) => ({ id, label: { "1h": "1 hour", "24h": "24 hours", "7d": "7 days", talk: "During talk" }[id] }))} />
          Access
          <Seg
            size="sm"
            value={sh.access}
            onChange={(access) => setShare({ access })}
            options={[
              { id: "link", label: "Anyone with link" },
              { id: "org", label: "GitHub org only" },
              { id: "pass", label: "Password" },
            ]}
          />
          {sh.access === "pass" && <Input type="password" value={sh.pw} onChange={(e) => setShare({ pw: e.target.value })} placeholder="Viewer password" className="h-8 border-zinc-800 text-xs" />}
        </div>
        <div className="flex flex-col gap-2">
          {toggles.map(([k, label, sub]) => (
            <ToggleRow key={k} label={label} sub={sub} checked={!!sh[k]} onChange={(v) => setShare({ [k]: v })} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
