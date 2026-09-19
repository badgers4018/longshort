import { useMemo, useRef } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Field } from "@/components/field";
import { TabHeader, Stat } from "@/components/headline";
import { ChartTip } from "@/components/charts/chart-tip";
import {
  GRID_ALPHAS,
  GRID_FEES,
  ratioHistogram,
  runShillerWindows,
  winRateAt,
} from "@/lib/calc/shiller";
import { cn, formatPct } from "@/lib/utils";
import { useParams } from "@/store/use-params";

import { LINE, MUTED, NAVY } from "@/lib/palette";

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

  const grid = useMemo(() => {
    return GRID_FEES.map((fee) =>
      GRID_ALPHAS.map((alpha) => ({
        fee,
        alpha,
        win: winRateAt(result.windows, p.netExposure, alpha, fee, p.hedgedVolReduction),
      })),
    );
  }, [result.windows, p.netExposure, p.hedgedVolReduction]);

  const hiFee = GRID_FEES.reduce(
    (best, f, i) => (Math.abs(f - p.allInFee) < Math.abs(GRID_FEES[best] - p.allInFee) ? i : best),
    0,
  );
  const hiAlpha = GRID_ALPHAS.reduce(
    (best, a, i) => (Math.abs(a - p.shillerAlpha) < Math.abs(GRID_ALPHAS[best] - p.shillerAlpha) ? i : best),
    0,
  );

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
          <Stat label="Hedged book wins" value={formatPct(result.winRate * 100, 0)} tone={result.winRate > 0 ? "win" : "oxblood"} />
          <Stat label="Median wealth ratio" value={`${result.medianRatio.toFixed(2)}×`} />
          <Stat
            label="Winning-window vol"
            value={result.winRate > 0 ? formatPct(result.winningVol, 0) : "—"}
            hint={result.winRate > 0 ? `Losing windows: ${formatPct(result.losingVol, 0)}` : `Losing windows: ${formatPct(result.losingVol, 0)}`}
          />
        </div>

        <div>
          <h3 className="text-muted mb-3 font-ui text-xs font-medium tracking-kicker uppercase">
            Share of windows the hedged book won, by decade
          </h3>
          <div className="grid grid-cols-5 gap-1 sm:grid-cols-8">
            {decade.map((row) => (
              <div
                key={row.decade}
                className={cn(
                  "flex h-11 flex-col items-center justify-center rounded-xs",
                  row.win >= 50 ? "bg-win text-cream" : row.win > 0 ? "bg-gold text-navy" : "bg-ox text-cream",
                )}
              >
                <span className="font-ui text-[10px] font-medium tracking-kicker uppercase opacity-80">
                  {row.decade}
                </span>
                <span className="tabular text-xs font-semibold">{row.win.toFixed(0)}%</span>
              </div>
            ))}
          </div>
          {result.winRate === 0 ? (
            <p className="text-muted mt-2 text-xs leading-5">
              0 of {decade.length} decades. The cells aren't missing data — at {formatPct(p.allInFee, 0)} fees
              and {formatPct(p.shillerAlpha, 0)} alpha the hedge never cleared the index.
            </p>
          ) : null}
        </div>

        <div>
          <h3 className="text-muted mb-3 font-ui text-xs font-medium tracking-kicker uppercase">
            Win rate across fee × alpha — {result.n} windows
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-center">
              <thead>
                <tr>
                  <th className="text-muted w-24 pr-2 text-left font-ui text-xs font-medium tracking-wide">
                    Fee \ Alpha
                  </th>
                  {GRID_ALPHAS.map((a) => (
                    <th key={a} className="tabular text-muted px-0.5 pb-2 font-ui text-xs font-medium">
                      {a}%
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.map((row, fi) => (
                  <tr key={GRID_FEES[fi]}>
                    <th className="tabular pr-2 text-left font-ui text-xs font-semibold text-navy">
                      {GRID_FEES[fi]}%
                    </th>
                    {row.map((cell, ai) => {
                      const on = fi === hiFee && ai === hiAlpha;
                      return (
                        <td key={`${cell.fee}-${cell.alpha}`} className="p-0.5">
                          <div
                            className={cn(
                              "flex h-11 items-center justify-center rounded-xs text-[12px] font-semibold tabular",
                              cell.win >= 0.5 && "bg-win text-cream",
                              cell.win > 0 && cell.win < 0.5 && "bg-gold text-navy",
                              cell.win === 0 && "bg-ox text-cream",
                              on && "ring-2 ring-navy ring-offset-1 ring-offset-paper",
                            )}
                            title={`${cell.win * 100}% of windows at ${cell.fee}% fees, ${cell.alpha}% alpha`}
                          >
                            {(cell.win * 100).toFixed(0)}%
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-muted mt-2 text-xs">
            Navy ring is your current fee and alpha. Green: hedge wins ≥ half of history. Gold: some decades.
            Oxblood: none.
          </p>
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
            {result.winRate === 0
              ? `None of the ${result.n} ${result.windowYears}-year windows since 1871. Median terminal wealth is ${result.medianRatio.toFixed(2)}× the index. Losing windows ran ${formatPct(result.losingReturn)} geometric at ${formatPct(result.losingVol, 0)} vol. Raise alpha or cut fees in the grid — the arithmetic does not negotiate.`
              : `Winning ${result.windowYears}-year windows had median geometric equity return of ${formatPct(result.winningReturn)} and vol of ${formatPct(result.winningVol, 0)}. Losing windows: ${formatPct(result.losingReturn)} return, ${formatPct(result.losingVol, 0)} vol. The hedge earns its keep in high-vol, sideways markets — and still often fails to clear the fee load.`}
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
