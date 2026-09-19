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
import { Field, Toggle } from "@/components/field";
import { TabHeader, Stat } from "@/components/headline";
import { ChartTip } from "@/components/charts/chart-tip";
import { fromApp, fullBreakdown } from "@/lib/calc/fees";
import { formatPct } from "@/lib/utils";
import { useParams } from "@/store/use-params";

import { GOLD, LINE, CHART_TICK, MUTED, NAVY, OX } from "@/lib/palette";

export function FeeTab() {
  const p = useParams();
  const rootRef = useRef<HTMLElement>(null);
  const d = useMemo(() => fullBreakdown(fromApp(p)), [p]);

  const waterfall = [
    { name: "Alpha", value: p.grossAlpha, fill: GOLD },
    { name: "Beta", value: d.betaContribution, fill: NAVY },
    { name: "Mgmt", value: -d.mgmt, fill: OX },
    { name: "Incentive", value: -d.incentive, fill: OX },
    { name: "Pass-thru", value: -d.passThrough, fill: OX },
    { name: "Borrow", value: -d.borrowCost, fill: OX },
    { name: "Drag", value: -d.varDrag, fill: OX },
  ].reduce<{ name: string; base: number; rise: number; fill: string; label: number }[]>(
    (acc, step) => {
      const prev = acc.length ? acc[acc.length - 1].base + acc[acc.length - 1].rise : 0;
      const rise = step.value;
      const base = rise >= 0 ? prev : prev + rise;
      acc.push({ name: step.name, base, rise: Math.abs(rise), fill: step.fill, label: step.value });
      return acc;
    },
    [],
  );

  const compare = [
    { name: "Net geometric", value: d.netGeo, fill: OX },
    { name: "Unlevered beta", value: d.betaGeo, fill: NAVY },
  ];

  const splitTotal = Math.max(d.transfer, 0.01);
  const fairPct = Math.min(100, (d.fairCompensation / splitTotal) * 100);
  const deadPct = Math.min(100, (d.deadweight / splitTotal) * 100);

  const set = p.setParam;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section ref={rootRef} className="space-y-6">
        <TabHeader
          kicker="Tab 1 · Fee decomposition"
          text={`This book needs ${formatPct(d.breakEvenAlpha, 1)} annual alpha to match the index`}
          filename="fee-decomposition.png"
          targetRef={rootRef}
        />

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
          <Stat label="Net geometric" value={formatPct(d.netGeo)} tone={d.netGeo >= d.betaGeo ? "win" : "oxblood"} />
          <Stat label="Unlevered beta" value={formatPct(d.betaGeo)} />
          <Stat label="Total fee load" value={formatPct(d.totalFeeLoad)} tone="oxblood" />
          <Stat
            label="Wealth ratio"
            value={`${d.terminalWealthRatio.toFixed(2)}×`}
            hint={`${p.holdingPeriod}-year terminal vs. index`}
          />
        </div>

        <div>
          <h3 className="mb-3 font-ui text-sm font-medium tracking-kicker text-muted uppercase">From gross alpha to net geometric</h3>
          <div className="h-56 rounded-md bg-surface pt-2 shadow-[var(--shadow-border)] md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfall} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
                <CartesianGrid stroke={LINE} vertical={false} />
                <XAxis dataKey="name" tick={CHART_TICK} interval={0} height={52} />
                <YAxis tick={CHART_TICK} tickFormatter={(v) => `${Number(v).toFixed(1)}%`} />
                <ReferenceLine
                  y={d.betaGeo}
                  stroke={NAVY}
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{ value: "Index", fill: MUTED, fontSize: 12, position: "insideTopRight" }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(28,28,28,0.04)" }}
                  content={<ChartTip format={(n) => formatPct(n)} />}
                />
                <Bar dataKey="base" stackId="a" fill="transparent" isAnimationActive={false} />
                <Bar dataKey="rise" stackId="a" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                  {waterfall.map((e) => (
                    <Cell key={e.name} fill={e.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-muted mt-2 text-sm">
            Dashed line is unlevered-beta geometric — the index match. Last bar lands at net geometric.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 font-ui text-sm font-medium tracking-kicker text-muted uppercase">Net geometric vs. unlevered beta</h3>
            <div className="h-40 rounded-md bg-surface pt-2 shadow-[var(--shadow-border)]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compare} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <XAxis type="number" tickFormatter={(v) => `${Number(v).toFixed(1)}%`} tick={CHART_TICK} />
                  <YAxis type="category" dataKey="name" width={118} tick={{ ...CHART_TICK, fill: NAVY }} />
                  <ReferenceLine x={0} stroke={NAVY} />
                  <Tooltip content={<ChartTip format={(n) => formatPct(n)} />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={22} isAnimationActive={false}>
                    {compare.map((e) => (
                      <Cell key={e.name} fill={e.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-ui text-sm font-medium tracking-kicker text-muted uppercase">Fee integral — transfer vs. deadweight</h3>
            <div className="space-y-3">
              <div className="flex h-10 overflow-hidden rounded-sm bg-line">
                <div
                  className="bg-navy"
                  style={{ width: `${fairPct}%` }}
                  title="Fair compensation for alpha delivered"
                />
                <div
                  className="bg-ox"
                  style={{ width: `${deadPct}%` }}
                  title="Foregone compounding (the misallocation)"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted font-ui text-sm font-medium tracking-kicker uppercase">
                    Total fees extracted
                  </div>
                  <div className="tabular font-display text-xl font-medium text-navy">
                    {formatPct(d.transfer, 1)}
                  </div>
                  <p className="text-muted mt-1 text-sm">Transfer — cumulative fees as % of initial capital.</p>
                </div>
                <div>
                  <div className="text-muted font-ui text-sm font-medium tracking-kicker uppercase">
                    Foregone compounding
                  </div>
                  <div className="tabular font-display text-xl font-medium text-ox">
                    {formatPct(d.deadweight, 1)}
                  </div>
                  <p className="text-muted mt-1 text-sm">
                    Deadweight — fees compounded at the equity rate, less excess delivered.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-muted text-sm leading-relaxed">
          The ½σ² drag formula is a second-order approximation, exact under lognormality. Under negative
          skew (which this essay argues is endemic to long-short), the true drag is larger. This makes the
          break-even alpha estimate conservative. See Tab 3's skew slider for the higher-order correction.
        </p>
      </section>

      <aside className="space-y-4 rounded-lg bg-cream p-5">
        <h3 className="font-display text-title font-medium text-navy">The book</h3>
        <Field label="Gross alpha" value={p.grossAlpha} min={0} max={20} step={0.5} onChange={(v) => set("grossAlpha", v)} format={(v) => formatPct(v)} />
        <Field label="Net exposure" value={p.netExposure} min={0} max={1} step={0.1} onChange={(v) => set("netExposure", v)} format={(v) => v.toFixed(1)} />
        <Field label="Gross exposure" value={p.grossExposure} min={1} max={4} step={0.1} onChange={(v) => set("grossExposure", v)} format={(v) => v.toFixed(1)} />
        <Field label="Portfolio volatility" value={p.portfolioVol} min={2} max={30} step={1} onChange={(v) => set("portfolioVol", v)} format={(v) => formatPct(v, 0)} />
        <Field label="Borrow — GC" value={p.borrowGcBps} min={0} max={100} step={5} onChange={(v) => set("borrowGcBps", v)} format={(v) => `${v} bps`} />
        <Field label="Borrow — crowded names" value={p.borrowCrowdedBps} min={50} max={1000} step={25} onChange={(v) => set("borrowCrowdedBps", v)} format={(v) => `${v} bps`} />
        <Field label="Crowded name weight" value={p.crowdedWeight} min={0} max={50} step={5} onChange={(v) => set("crowdedWeight", v)} format={(v) => formatPct(v, 0)} />
        <Field label="Management fee" value={p.mgmtFee} min={0} max={5} step={0.25} onChange={(v) => set("mgmtFee", v)} format={(v) => formatPct(v, 2)} />
        <Field label="Incentive fee" value={p.incentiveFee} min={0} max={50} step={5} onChange={(v) => set("incentiveFee", v)} format={(v) => formatPct(v, 0)} />
        <Toggle label="Pod-level netting" value={p.podNetting} onChange={(v) => set("podNetting", v)} />
        <Field label="Pass-through costs" value={p.passThrough} min={0} max={5} step={0.25} onChange={(v) => set("passThrough", v)} format={(v) => formatPct(v, 2)} />
        <Field label="Holding period" value={p.holdingPeriod} min={1} max={30} step={1} onChange={(v) => set("holdingPeriod", v)} format={(v) => `${v} yr`} />
        <p className="text-muted text-sm leading-relaxed">
          Weighted borrow {d.weightedBorrowBps.toFixed(0)} bps on {d.shortExposure.toFixed(2)}× short =
          {" "}{formatPct(d.borrowCost, 2)} of NAV. Gross return {formatPct(d.grossReturn)} = net × beta +
          alpha.
        </p>
      </aside>
    </div>
  );
}
