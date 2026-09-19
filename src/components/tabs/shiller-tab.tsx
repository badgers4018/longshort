import { useMemo, useRef } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Field } from "@/components/field";
import { TabHeader, Stat } from "@/components/headline";
import { ChartTip } from "@/components/charts/chart-tip";
import { ratioHistogram, runShillerWindows } from "@/lib/calc/shiller";
import { formatPct } from "@/lib/utils";
import { useParams } from "@/store/use-params";

import { GOLD, LINE, MUTED, NAVY, OX, WIN } from "@/lib/palette";

export function ShillerTab() {
  const p = useParams();
  const rootRef = useRef<HTMLElement>(null);

  const result = useMemo(
    () =>
      runShillerWindows(
        { netExposure: p.netExposure },
        p.windowYears,
        p.allInFee,
        p.hedgedVolReduction,
        p.shillerAlpha,
      ),
    [p.netExposure, p.windowYears, p.allInFee, p.hedgedVolReduction, p.shillerAlpha],
  );

  const hist = useMemo(() => ratioHistogram(result.windows), [result.windows]);
  const histDomain = useMemo((): [number, number] => {
    if (hist.length === 0) return [0.5, 1.5];
    const xs = hist.map((h) => h.x);
    return [Math.min(1, ...xs), Math.max(1, ...xs)];
  }, [hist]);

  const decade = useMemo(() => {
    const buckets = new Map<number, { n: number; wins: number }>();
    for (const w of result.windows) {
      const d = Math.floor(w.startYear / 10) * 10;
      const cur = buckets.get(d) ?? { n: 0, wins: 0 };
      cur.n += 1;
      if (w.hedgedWins) cur.wins += 1;
      buckets.set(d, cur);
    }
    return [...buckets.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([decade, v]) => ({
        decade: String(decade),
        win: (v.wins / v.n) * 100,
      }));
  }, [result.windows]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section ref={rootRef} className="space-y-6">
        <TabHeader
          kicker="Tab 5 · Shiller rolling windows"
          text={`In ${(result.feeExceededRate * 100).toFixed(0)}% of ${result.windowYears}-year windows since 1871, the fee load exceeded the hedge benefit`}
          filename="shiller-windows.png"
          targetRef={rootRef}
        />

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Windows" value={String(result.n)} hint={`${result.start} → ${result.end}`} />
          <Stat label="Hedged book wins" value={formatPct(result.winRate * 100, 0)} tone="win" />
          <Stat label="Median wealth ratio" value={`${result.medianRatio.toFixed(2)}×`} />
          <Stat
            label="Winning-window vol"
            value={formatPct(result.winningVol, 0)}
            hint={`Losing windows: ${formatPct(result.losingVol, 0)}`}
          />
        </div>

        <div>
          <h3 className="text-muted mb-3 font-ui text-xs font-medium tracking-kicker uppercase">
            Share of windows the hedged book won, by decade
          </h3>
          <div className="h-52 rounded-md bg-surface pt-2 shadow-[var(--shadow-border)] md:h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={decade} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
                <CartesianGrid stroke={LINE} vertical={false} />
                <XAxis dataKey="decade" tick={{ fill: MUTED, fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${v}%`} tick={{ fill: MUTED, fontSize: 11 }} />
                <ReferenceLine y={50} stroke={GOLD} strokeDasharray="4 4" />
                <Tooltip content={<ChartTip format={(n) => `${Number(n).toFixed(0)}%`} />} />
                <Bar dataKey="win" name="Win rate" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                  {decade.map((row) => (
                    <Cell key={row.decade} fill={row.win >= 50 ? WIN : OX} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-muted mb-3 font-ui text-xs font-medium tracking-kicker uppercase">
            Terminal wealth ratio (hedged / unlevered) across windows
          </h3>
          <div className="h-44 rounded-md bg-surface pt-2 shadow-[var(--shadow-border)]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hist} margin={{ top: 16, right: 8, left: -12, bottom: 8 }}>
                <CartesianGrid stroke={LINE} vertical={false} />
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={histDomain}
                  tickFormatter={(v) => Number(v).toFixed(1)}
                  tick={{ fill: MUTED, fontSize: 11 }}
                />
                <YAxis tick={{ fill: MUTED, fontSize: 11 }} />
                <ReferenceLine
                  x={1}
                  stroke={NAVY}
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{ value: "1.0×", position: "top", fill: MUTED, fontSize: 10 }}
                />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="n" name="Windows" fill={NAVY} radius={[3, 3, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg bg-cream px-5 py-4 text-sm leading-6 text-navy">
          <p className="font-semibold">Where the long-short book won</p>
          <p className="text-muted mt-1">
            Winning {result.windowYears}-year windows had median geometric equity return of{" "}
            {formatPct(result.winningReturn)} and vol of {formatPct(result.winningVol, 0)}. Losing windows:{" "}
            {formatPct(result.losingReturn)} return, {formatPct(result.losingVol, 0)} vol. The hedge earns
            its keep in high-vol, sideways markets — and still often fails to clear the fee load.
          </p>
        </div>
      </section>

      <aside className="space-y-4 rounded-lg bg-cream p-5">
        <h3 className="font-display text-title font-medium text-navy">The history</h3>
        <Field label="Rolling window" value={p.windowYears} min={5} max={30} step={5} onChange={(v) => p.setParam("windowYears", v)} format={(v) => `${v} yr`} />
        <Field label="All-in fee load" value={p.allInFee} min={1} max={10} step={0.5} onChange={(v) => p.setParam("allInFee", v)} format={(v) => formatPct(v)} />
        <Field label="Hedged vol reduction" value={p.hedgedVolReduction} min={20} max={80} step={10} onChange={(v) => p.setParam("hedgedVolReduction", v)} format={(v) => formatPct(v, 0)} />
        <Field label="Alpha assumption" value={p.shillerAlpha} min={0} max={10} step={0.5} onChange={(v) => p.setParam("shillerAlpha", v)} format={(v) => formatPct(v)} />
        <p className="text-muted text-xs leading-relaxed">
          Real total returns from Shiller's S&P Composite, 1871–{result.end.slice(0, 4)}. Monthly
          observations, {result.windowYears}-year rolling windows, stepped quarterly. Net exposure is taken
          from Tab 1. Geometric hedge return = (net × window arithmetic) + alpha − fees − ½σ²_hedged.
        </p>
      </aside>
    </div>
  );
}
