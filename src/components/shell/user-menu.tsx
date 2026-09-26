"use client";

/* eslint-disable @next/next/no-img-element -- GitHub avatar URL */
import { toast } from "sonner";
import { Icon } from "@/components/common/icon";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMeQuery } from "@/hooks/use-queries";
import { useSignOut } from "@/hooks/use-sign-out";
import { useUi } from "@/stores/ui";

export function Avatar({ size = 28 }: { size?: number }) {
  const me = useMeQuery().data?.user;
  if (me?.avatar) return <img src={me.avatar} alt={me.login} width={size} height={size} className="rounded-full" style={{ width: size, height: size }} />;
  return (
    <span className="grid place-items-center rounded-full bg-gradient-to-br from-blue-400 to-violet-400 text-[11px] font-bold text-zinc-950" style={{ width: size, height: size }}>
      {(me?.login ?? "?").slice(0, 2).toUpperCase()}
    </span>
  );
}

export function UserMenu() {
  const setView = useUi((s) => s.setView);
  const me = useMeQuery().data?.user;
  const signOut = useSignOut();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="Account menu">
        <Avatar />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal text-zinc-400">@{me?.login}</DropdownMenuLabel>
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
