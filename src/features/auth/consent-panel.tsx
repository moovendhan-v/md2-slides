"use client";

import { toast } from "sonner";
import { DEMO_USER, SEED_REPOS } from "@/data";
import { Icon } from "@/components/common/icon";
import { BrandMark } from "@/components/shell/app-header";
import { Avatar } from "@/components/shell/user-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "@/stores/session";
import { useUi } from "@/stores/ui";

/** GitHub-style OAuth consent: repository scope + per-repo selection. */
export function ConsentPanel() {
  const { scope, picked, set } = useSession();
  const allow = () => {
    set({ status: "loading" });
    setTimeout(() => {
      useSession.getState().set({ status: "in" });
      useUi.getState().setView("repo");
      toast(`Signed in as @${DEMO_USER.login}`);
    }, 1200);
  };
  const options: ["all" | "selected", string, string][] = [
    ["all", "All repositories", `Current and future repos on @${DEMO_USER.login}`],
    ["selected", "Only select repositories", "Recommended"],
  ];
  return (
    <div className="w-full max-w-[420px] overflow-hidden rounded-xl border border-zinc-800 bg-[#0d1117] text-[#e6edf3]">
      <div className="flex flex-col items-center gap-2 border-b border-zinc-800 p-6 text-center">
        <div className="flex items-center gap-3">
          <BrandMark size={44} />
          <span className="text-zinc-600">···</span>
          <Avatar size={44} />
        </div>
        <h2 className="text-lg">
          Authorize <b>Slidewise</b>
        </h2>
        <p className="text-xs text-zinc-400">by slidewise-app · wants to access your @{DEMO_USER.login} account</p>
      </div>
      <div className="flex flex-col gap-3 p-5">
        <span className="text-[13px] font-semibold">Repository access</span>
        {options.map(([id, label, sub]) => (
          <button key={id} type="button" className="flex items-start gap-3 text-left" onClick={() => set({ scope: id })}>
            <span className={cn("mt-0.5 size-4 shrink-0 rounded-full border-[#2f81f7]", scope === id ? "border-[5px]" : "border")} />
            <span className="flex flex-col">
              <span className="text-[13px]">{label}</span>
              <span className="text-xs text-zinc-500">{sub}</span>
            </span>
          </button>
        ))}
        {scope === "selected" && (
          <div className="overflow-hidden rounded-md border border-zinc-700">
            {SEED_REPOS.map((r) => {
              const on = picked[r.id] !== false;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => set({ picked: { ...picked, [r.id]: !on } })}
                  className="flex w-full items-center gap-3 border-b border-zinc-800 px-3 py-2 text-left text-[13px] last:border-0 hover:bg-white/5"
                >
                  <span className={cn("grid size-3.5 place-items-center rounded-sm border border-[#2f81f7] text-[10px] text-white", on && "bg-[#2f81f7]")}>{on ? "✓" : ""}</span>
                  <Icon name="book-bookmark" className="text-zinc-400" />
                  {r.id}
                </button>
              );
            })}
          </div>
        )}
        <div className="mt-2 grid grid-cols-2 gap-2.5">
          <Button variant="outline" className="border-zinc-700 bg-[#21262d] hover:bg-[#30363d]" onClick={() => set({ status: "signin" })}>
            Cancel
          </Button>
          <Button className="bg-[#238636] font-semibold text-white hover:bg-[#2ea043]" onClick={allow}>
            Authorize slidewise-app
          </Button>
        </div>
      </div>
    </div>
  );
}
