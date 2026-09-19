import { GOLD } from "@/lib/palette";
import { formatChartNum } from "@/lib/utils";

function pretty(n: unknown, format?: (v: number) => string) {
  if (typeof n !== "number" || !Number.isFinite(n)) return String(n ?? "—");
  return format ? format(n) : formatChartNum(n, 2);
}

export function ChartTip({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color?: string }[];
  label?: string | number;
  format?: (n: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const heading =
    typeof label === "number" ? pretty(label, format) : label ? String(label) : null;
  return (
    <div className="rounded-md bg-navy px-3 py-2 text-cream shadow-[var(--shadow-border)]">
      {heading ? (
        <div className="mb-1 font-ui text-sm tracking-kicker text-gold uppercase">{heading}</div>
      ) : null}
      {payload.map((p) => (
        <div key={p.name} className="tabular flex items-center gap-2 font-ui text-sm">
          <span className="size-1.5 rounded-full" style={{ background: p.color ?? GOLD }} />
          <span className="text-cream/80">{p.name}</span>
          <span className="ml-auto font-semibold">{pretty(p.value, format)}</span>
        </div>
      ))}
    </div>
  );
}