export function SectionHead({ kicker, title, sub, center = false }: { kicker: string; title: string; sub?: string; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <div className="font-mono text-xs tracking-widest text-blue-400 uppercase">{kicker}</div>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-balance text-zinc-50 md:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-[15px] leading-relaxed text-zinc-400">{sub}</p>}
    </div>
  );
}
