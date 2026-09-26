import { cn } from "@/lib/utils";

/** Phosphor web-font icon. `name` accepts `rocket` or `ph-rocket`. */
export function Icon({ name, className, style, title }: { name: string; className?: string; style?: React.CSSProperties; title?: string }) {
  const n = name.startsWith("ph-") ? name : "ph-" + (name || "cube");
  return <i aria-hidden={!title} title={title} className={cn("ph", n, className)} style={style} />;
}
