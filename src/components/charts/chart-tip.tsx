import { GOLD } from "@/lib/palette";

export function ChartTip({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color?: string }[];
  label?: string;
  format?: (n: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md bg-navy px-3 py-2 text-cream shadow-[var(--shadow-border)]">
      {label ? <div className="mb-1 font-ui text-xs tracking-kicker text-gold uppercase">{label}</div> : null}
      {payload.map((p) => (
        <div key={p.name} className="tabular flex items-center gap-2 font-ui text-xs">
          <span className="size-1.5 rounded-full" style={{ background: p.color ?? GOLD }} />
          <span className="text-cream/80">{p.name}</span>
          <span className="ml-auto font-semibold">
            {format ? format(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}
