import { useMemo, useRef, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { ChartTip } from "@/components/charts/chart-tip";
import { fromApp } from "@/lib/calc/fees";
import { runMonteCarlo, type McResult } from "@/lib/calc/montecarlo";
import { formatPct } from "@/lib/utils";
import { useParams } from "@/store/use-params";

import { GOLD, LINE, MUTED, NAVY, OX } from "@/lib/palette";

function mergeHist(result: McResult) {
  const [b, ls, cx] = result.summaries;
  return result.bins.map((x, i) => ({
    x: Number(x.toFixed(2)),
    beta: b.histogram[i]?.y ?? 0,
    ls: ls.histogram[i]?.y ?? 0,
    cx: cx.histogram[i]?.y ?? 0,
  }));
}

export function WealthTab() {
  const p = useParams();
  const rootRef = useRef<HTMLElement>(null);
  const [result, setResult] = useState<McResult | null>(null);
  const [running, setRunning] = useState(false);

  const book = fromApp(p);
  const convex = {
    skew: p.skew,
    convexityPremium: p.convexityPremium,
    payoffMultiple: p.payoffMultiple,
    triggerSigma: p.triggerSigma,
    eventFrequency: p.eventFrequency,
  };

  function run() {
    setRunning(true);
    window.setTimeout(() => {
      setResult(
        runMonteCarlo(book, convex, undefined, 10_000),
      );
      setRunning(false);
    }, 30);
  }

  const hist = useMemo(() => (result ? mergeHist(result) : []), [result]);
  const winner = result?.summaries.find((s) => s.id === result.headlineId);
  const ls = result?.summaries.find((s) => s.id === "longshort");

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section ref={rootRef} className="space-y-6">
        <TabHeader
          kicker="Tab 3 · Terminal wealth"
          text={
            winner
              ? `${winner.label} wins in ${(winner.winRate * 100).toFixed(0)}% of paths over ${result?.years} years`
              : "10,000 paths. Same draws. Three strategies. Ranked on median log wealth."
          }
          filename="terminal-wealth.png"
          targetRef={rootRef}
        />

        {!result ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg bg-cream px-6 text-center">
            <p className="text-muted max-w-md text-sm">
              Monte Carlo is deferred until you run it — 10,000 skew-adjusted paths, seeded at 20260910.
            </p>
            <Button onClick={run} disabled={running}>
              {running ? "Running…" : "Run simulation"}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button onClick={run} disabled={running} variant="secondary">
                {running ? "Running…" : "Re-run"}
              </Button>
              <p className="text-muted text-xs">Seed {result.seed} · {result.paths.toLocaleString()} paths</p>
            </div>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-x-5 gap-y-1 font-ui text-xs font-medium tracking-kicker uppercase">
                <span className="flex items-center gap-1.5 text-navy">
                  <span className="inline-block h-px w-3.5 bg-navy" /> Unlevered beta
                </span>
                <span className="flex items-center gap-1.5 text-ox">
                  <span className="inline-block h-px w-3.5 bg-ox" /> Long-short
                </span>
                <span className="flex items-center gap-1.5 text-gold-deep">
                  <span className="inline-block h-px w-3.5 bg-gold" /> Convexity
                </span>
                <span className="text-muted font-normal normal-case tracking-normal">
                  Dashed navy is the index match. Faint oxblood ticks are long-short 5th–95th.
                </span>
              </div>
              <div className="h-56 rounded-md bg-surface pt-2 shadow-[var(--shadow-border)] md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hist} margin={{ top: 8, right: 8, left: -16, bottom: 8 }} barGap={-6} barCategoryGap={1}>
                    <CartesianGrid stroke={LINE} vertical={false} />
                    <XAxis dataKey="x" type="number" domain={["dataMin", "dataMax"]} tick={{ fill: MUTED, fontSize: 11 }} tickFormatter={(v) => Number(v).toFixed(1)} />
                    <YAxis hide domain={[0, "auto"]} />
                    <Tooltip content={<ChartTip />} />
                    {ls && ls.p5 > 0 ? (
                      <ReferenceLine x={Math.log(ls.p5)} stroke={OX} strokeDasharray="2 3" strokeOpacity={0.35} />
                    ) : null}
                    {ls && ls.p95 > 0 ? (
                      <ReferenceLine x={Math.log(ls.p95)} stroke={OX} strokeDasharray="2 3" strokeOpacity={0.35} />
                    ) : null}
                    {result.summaries.map((s) => (
                      <ReferenceLine
                        key={s.id}
                        x={s.medianLog}
                        stroke={s.id === "beta" ? NAVY : s.id === "longshort" ? OX : GOLD}
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={
                          s.id === "beta"
                            ? { value: "Index", position: "insideTopRight", fill: MUTED, fontSize: 10 }
                            : undefined
                        }
                      />
                    ))}
                    <Bar dataKey="beta" name="Unlevered beta" fill={NAVY} fillOpacity={0.55} isAnimationActive={false} />
                    <Bar dataKey="ls" name="Long-short" fill={OX} fillOpacity={0.7} isAnimationActive={false} />
                    <Bar dataKey="cx" name="Convexity" fill={GOLD} fillOpacity={0.75} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="text-muted font-ui text-xs tracking-kicker uppercase">
                    <th className="pb-2 font-semibold">Strategy</th>
                    <th className="pb-2 font-semibold">Median</th>
                    <th className="pb-2 font-semibold">5th</th>
                    <th className="pb-2 font-semibold">25th</th>
                    <th className="pb-2 font-semibold">75th</th>
                    <th className="pb-2 font-semibold">95th</th>
                    <th className="pb-2 font-semibold">Win rate</th>
                    <th className="pb-2 font-semibold">Sharpe</th>
                  </tr>
                </thead>
                <tbody>
                  {result.summaries.map((s) => (
                    <tr key={s.id} className="border-t border-line">
                      <td className="py-2.5 font-medium text-navy">{s.label}</td>
                      <td className="tabular py-2.5">{s.median.toFixed(2)}×</td>
                      <td className="tabular py-2.5">{s.p5.toFixed(2)}×</td>
                      <td className="tabular py-2.5">{s.p25.toFixed(2)}×</td>
                      <td className="tabular py-2.5">{s.p75.toFixed(2)}×</td>
                      <td className="tabular py-2.5">{s.p95.toFixed(2)}×</td>
                      <td className="tabular py-2.5">{(s.winRate * 100).toFixed(1)}%</td>
                      <td className="tabular py-2.5">{s.sharpe.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Stat
                label="Crossover"
                value={
                  result.crossoverYear === 1
                    ? "From the start"
                    : result.crossoverYear
                      ? `Year ${result.crossoverYear}`
                      : "None in window"
                }
                hint="When long+convexity overtakes long-short on median log wealth"
              />
              {ls ? (
                <Stat
                  label="True variance drag"
                  value={formatPct(ls.trueDrag, 2)}
                  tone="oxblood"
                  hint={`½σ² approximation ${formatPct(ls.approxDrag, 2)}`}
                />
              ) : null}
              <Stat
                label="P(long-short beats beta)"
                value={`${(result.beatBetaRate * 100).toFixed(0)}%`}
                tone={result.beatBetaRate >= 0.5 ? "win" : "oxblood"}
                hint="Share of paths where the net-of-fee book finishes richer than the index"
              />
            </div>
          </>
        )}
      </section>

      <aside className="space-y-4 rounded-lg bg-cream p-5">
        <h3 className="font-display text-title font-medium text-navy">Convexity & skew</h3>
        <Field label="Skew (long-short)" value={p.skew} min={-1.5} max={0} step={0.1} onChange={(v) => p.setParam("skew", v)} />
        <Field label="Convexity premium" value={p.convexityPremium} min={0} max={4} step={0.1} onChange={(v) => p.setParam("convexityPremium", v)} format={(v) => formatPct(v)} />
        <Field label="Payoff multiple" value={p.payoffMultiple} min={1} max={20} step={0.5} onChange={(v) => p.setParam("payoffMultiple", v)} />
        <Field label="Trigger threshold" value={p.triggerSigma} min={1} max={4} step={0.1} onChange={(v) => p.setParam("triggerSigma", v)} format={(v) => `${v.toFixed(1)}σ`} />
        <Field label="Event frequency" value={p.eventFrequency} min={0} max={0.4} step={0.01} onChange={(v) => p.setParam("eventFrequency", v)} format={(v) => `${(v * 100).toFixed(0)}%/yr`} />
        <p className="text-muted text-xs leading-relaxed">
          Long-short uses Tab 1's net arithmetic return and book vol, with the skew slider replacing
          the lognormal. Beta and convexity share the same Gaussian draws. Holding period is Tab 1.
        </p>
        <Button onClick={run} disabled={running} className="w-full">
          {running ? "Running…" : "Run simulation"}
        </Button>
      </aside>
    </div>
  );
}
