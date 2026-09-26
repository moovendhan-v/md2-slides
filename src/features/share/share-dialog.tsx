"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Seg, ToggleRow } from "@/components/common/controls";
import { Icon } from "@/components/common/icon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ExpiryKey } from "@/domain/share/payload";
import { cn } from "@/lib/utils";
import { useSession, type ShareSettings } from "@/stores/session";
import { useUi } from "@/stores/ui";
import { useShareLink } from "./use-share-link";

const EXPIRY: { id: ExpiryKey; label: string }[] = [
  { id: "1h", label: "1 hour" },
  { id: "24h", label: "24 hours" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "never", label: "Never" },
];

function Qr({ url }: { url: string }) {
  const [src, setSrc] = useState<string>();
  useEffect(() => {
    let alive = true;
    void import("qrcode").then((q) => q.toDataURL(url, { margin: 1, width: 220, errorCorrectionLevel: "L" })).then((d) => alive && setSrc(d), () => alive && setSrc(undefined));
    return () => {
      alive = false;
    };
  }, [url]);
  // A generated data: URL — nothing for next/image to optimise.
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt="QR code for the share link" className="size-44 rounded-lg bg-white p-1" /> : <p className="text-xs text-zinc-500">Link too long for a QR code.</p>;
}

/** View-only share link: the deck travels inside the link (nothing is uploaded or stored). */
export function ShareDialog() {
  const open = useUi((s) => s.modal === "share");
  const close = useUi((s) => s.closeModal);
  const settings = useSession((s) => s.share);
  const setShare = useSession((s) => s.setShare);
  const [password, setPassword] = useState("");
  const [qr, setQr] = useState(false);
  const link = useShareLink(settings, password, open);
  const toggles: [keyof ShareSettings, string, string][] = [
    ["notes", "Show speaker notes", "Viewers can read notes and open a speaker view"],
    ["download", "Allow .md download", "Viewers can download the Markdown"],
    ["present", "Open in present mode", "The link starts full-screen on slide 1"],
  ];
  const kb = link ? (link.bytes / 1024).toFixed(1) : "…";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-zinc-800 bg-zinc-950 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share a view-only link</DialogTitle>
          <DialogDescription>The deck is packed into the link itself. Nothing is uploaded or stored on a server.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input readOnly value={link?.url ?? "Building link…"} onFocus={(e) => e.currentTarget.select()} className="h-9 border-zinc-800 font-mono text-xs" aria-label="Share link" />
          <Button
            className="h-9 gap-1.5 bg-zinc-50 text-zinc-950 hover:bg-zinc-200"
            disabled={!link || link.health === "too-long"}
            onClick={() => {
              if (!link) return;
              navigator.clipboard?.writeText(link.url).then(() => toast("Link copied"), () => toast("Copy failed — select the link and copy it"));
            }}
          >
            <Icon name="copy" /> Copy
          </Button>
          <Button variant="outline" size="icon" className="size-9 border-zinc-800" title="Open the link in a new tab" disabled={!link} onClick={() => link && window.open(link.url, "_blank", "noopener")}>
            <Icon name="arrow-square-out" />
          </Button>
          <Button variant="outline" size="icon" className={cn("size-9 border-zinc-800", qr && "bg-zinc-900")} title="Show QR code" disabled={!link} onClick={() => setQr(!qr)}>
            <Icon name="qr-code" />
          </Button>
        </div>
        <p className={cn("text-xs", link?.health === "ok" ? "text-zinc-500" : link?.health === "long" ? "text-amber-400" : "text-red-400")}>
          {kb} KB ·{" "}
          {link?.health === "too-long"
            ? "too long for a link. Download as HTML instead (coming in Export)."
            : link?.health === "long"
              ? "long link: fine in browsers and email, but some chat apps may cut it off."
              : "safe to paste anywhere."}
        </p>
        {qr && link && link.health !== "too-long" && (
          <div className="flex justify-center">
            <Qr url={link.url} />
          </div>
        )}
        <div className="flex flex-col gap-2 text-xs text-zinc-400">
          Expires
          <Seg size="sm" value={settings.exp} onChange={(exp) => setShare({ exp })} options={EXPIRY} />
          Password <span className="text-zinc-600">(optional, encrypts the deck in the link)</span>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="No password" autoComplete="new-password" className="h-8 border-zinc-800 text-xs" />
        </div>
        <div className="flex flex-col gap-2">
          {toggles.map(([k, label, sub]) => (
            <ToggleRow key={k} label={label} sub={sub} checked={!!settings[k]} onChange={(v) => setShare({ [k]: v })} />
          ))}
        </div>
        {link && link.missingImages.length > 0 && (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            {link.missingImages.length} image{link.missingImages.length > 1 ? "s use" : " uses"} a repo path ({link.missingImages.slice(0, 2).join(", ")}
            {link.missingImages.length > 2 ? "…" : ""}) and won&apos;t show for viewers. Use full image URLs to include them.
          </p>
        )}
        <p className="text-[11px] leading-relaxed text-zinc-600">
          Expiry is checked by the viewer. Anyone with the link can see the deck until then; add a password to keep it private.
        </p>
      </DialogContent>
    </Dialog>
  );
}
