"use client";

import { ToggleRow } from "@/components/common/controls";
import { Icon } from "@/components/common/icon";
import { Avatar } from "@/components/shell/user-menu";
import { Button } from "@/components/ui/button";
import { useMeQuery } from "@/hooks/use-queries";
import { useSignOut } from "@/hooks/use-sign-out";
import { timeAgo } from "@/lib/time";
import { pref, useSession } from "@/stores/session";
import { useSelectedRepos } from "@/hooks/use-selected-repos";
import { useUi } from "@/stores/ui";

const WORKFLOW: [string, string, string, string, boolean][] = [
  ["git-commit", "Commit on save (⌘S)", "Skip the dialog and push directly", "autoCommit", false],
  ["git-pull-request", "Open pull request instead of pushing", "For protected branches", "usePR", false],
  ["sparkle", "Format on save", "Trim whitespace before commit", "fmtSave", true],
  ["eye", "Live preview while typing", "Turn off for very large decks", "live", true],
];

function Card({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-zinc-800 p-5">
      <div>
        <h3 className="text-[15px] font-medium">{title}</h3>
        <p className="text-xs text-zinc-500">{sub}</p>
      </div>
      {children}
    </section>
  );
}

export function ProfileView() {
  const { prefs, togglePref } = useSession();
  const selected = useSelectedRepos().repos;
  const me = useMeQuery().data;
  const user = me?.user;
  const signOut = useSignOut();
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-2xl flex-col gap-5 px-6 py-8">
        <div className="flex items-center gap-4">
          <Avatar size={56} />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{user?.name}</h1>
            <p className="text-[13px] text-zinc-400">@{user?.login}</p>
                      </div>
        </div>
        <Card title="GitHub connection" sub="OAuth app · token kept in an encrypted http-only cookie">
          <div className="flex items-center gap-3 text-[13px]">
            <Icon name="github-logo" className="text-lg" />
            <span className="flex-1">
              @{user?.login} <span className="text-xs text-zinc-500">· signed in {user ? timeAgo(user.since) : ""}</span>
            </span>
            <code className="font-mono text-xs text-zinc-400">{user?.scope || "—"}</code>
          </div>
          <div className="flex items-center gap-3 text-[13px]">
            <Icon name="key" className="text-lg" />
            <span className="flex-1">
              Session <span className="text-xs text-zinc-500">· signs you out on this device</span>
            </span>
            <Button variant="outline" size="sm" className="border-zinc-800 text-red-400" onClick={signOut}>
              Sign out
            </Button>
          </div>
          <div className="flex items-center gap-3 text-[13px]">
            <Icon name="arrows-clockwise" className="text-lg" />
            <span className="flex-1">
              App access <span className="text-xs text-zinc-500">· review or revoke Slidewise on GitHub</span>
            </span>
            <Button variant="outline" size="sm" className="border-zinc-800" asChild>
              <a href={me?.manageUrl} target="_blank" rel="noreferrer">
                Manage
              </a>
            </Button>
          </div>
        </Card>
        <Card title="Repositories" sub="Only these appear in Slidewise">
          {selected.map((r) => (
            <div key={r.id} className="flex items-center gap-3 text-[13px]">
              <Icon name={r.private ? "lock-simple" : "book-bookmark"} className="text-zinc-500" />
              <span className="flex-1 truncate">{r.id}</span>
              <span className="text-xs text-zinc-500">{r.branch}</span>
            </div>
          ))}
          <Button variant="outline" size="sm" className="self-start border-zinc-800" onClick={() => useUi.getState().openModal("repos")}>
            Choose repositories
          </Button>
        </Card>
        <Card title="Workflow" sub="How edits become commits">
          {WORKFLOW.map(([icon, label, sub, key, def]) => (
            <ToggleRow key={key} icon={icon} label={label} sub={sub} checked={pref(prefs, key, def)} onChange={() => togglePref(key, def)} />
          ))}
        </Card>
      </div>
    </div>
  );
}
