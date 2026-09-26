import { Icon } from "@/components/common/icon";

export function BootScreen({ label }: { label: string }) {
  return (
    <div className="grid h-dvh place-items-center bg-zinc-950 text-sm text-zinc-500">
      <span className="flex items-center gap-2">
        <Icon name="circle-notch" className="animate-spin" />
        {label}
      </span>
    </div>
  );
}
