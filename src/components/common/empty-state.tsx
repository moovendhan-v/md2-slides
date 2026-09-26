import { Icon } from "./icon";

export function EmptyState({ icon, title, body, children }: { icon: string; title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-xl border border-zinc-800 bg-zinc-900/60">
        <Icon name={icon} className="text-2xl text-zinc-400" />
      </span>
      <h3 className="text-[15px] font-medium">{title}</h3>
      <p className="max-w-sm text-[13px] text-zinc-500">{body}</p>
      {children}
    </div>
  );
}
