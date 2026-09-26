"use client";

import { toast } from "sonner";
import { DEMO_USER } from "@/data";
import { Icon } from "@/components/common/icon";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSession } from "@/stores/session";
import { useUi } from "@/stores/ui";

export function Avatar({ size = 28 }: { size?: number }) {
  return (
    <span className="grid place-items-center rounded-full bg-gradient-to-br from-blue-400 to-violet-400 text-[11px] font-bold text-zinc-950" style={{ width: size, height: size }}>
      {DEMO_USER.initials}
    </span>
  );
}

export function UserMenu() {
  const setView = useUi((s) => s.setView);
  const signOut = () => useSession.getState().set({ status: "signin", mode: "in" });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="Account menu">
        <Avatar />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal text-zinc-400">@{DEMO_USER.login}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setView("profile")}>
          <Icon name="user-circle" /> Profile & GitHub
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setView("templates")}>
          <Icon name="squares-four" /> Templates
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast("⌘K palette · ⌘S commit · ⌘↵ present · / insert")}>
          <Icon name="keyboard" /> Keyboard shortcuts
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="text-red-400 focus:text-red-400">
          <Icon name="sign-out" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
