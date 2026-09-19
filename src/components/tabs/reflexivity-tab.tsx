import { useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Play } from "lucide-react";
import { Field, Toggle } from "@/components/field";
import { TabHeader, Stat } from "@/components/headline";
import { Button } from "@/components/ui/button";
import { ChartTip } from "@/components/charts/chart-tip";
import { HORIZON, runReflexOnce, runReflexivity, summarizeReflexMc, type ReflexMonteCarlo } from "@/lib/calc/reflexivity";
import { MASTER_SEED } from "@/lib/calc/rng";
import { CHART_TICK, GOLD, LINE, MUTED, NAVY, OX } from "@/lib/palette";
import { formatChartNum, formatPct } from "@/lib/utils";
import { useParams } from "@/store/use-params";

export function ReflexivityTab() {
  const p = useParams();
  const rootRef = useRef<HTMLElement>(null);
  const [mc, setMc] = useState<ReflexMonteCarlo | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const params = {
    baselineAlpha: p.baselineAlpha,
    capacityConstant: p.capacityConstant,
    flowSensitivity: p.flowSensitivity,
    flowConvexity: p.flowConvexity,
    gammaAccrual: p.gammaAccrual,
    dischargeSensitivity: p.dischargeSensitivity,
    dischargeSeverity: p.dischargeSeverity,
    showCounterfactual: p.showCounterfactual,
  };
  const shared = {
    equityBeta: p.equityBeta,
    netExposure: p.netExposure,
    portfolioVol: p.portfolioVol,
    riskFree: p.riskFree,
  };

  const result = useMemo(
    () => runReflexivity(shared, params),
    [
      p.baselineAlpha,
      p.capacityConstant,
      p.flowSensitivity,
      p.flowConvexity,
      p.gammaAccrual,
      p.dischargeSensitivity,
      p.dischargeSeverity,
      p.equityBeta,
      p.netExposure,
      p.portfolioVol,
      p.riskFree,
    ],
  );
  const pre = result.preDischargeSharpe;
  const headline = result.dischargeMonth
    ? `Trailing Sharpe ${pre.toFixed(2)} in the 12 months before discharge`
    : `No discharge in 240 months. Trailing Sharpe ${pre.toFixed(2)}`;

  const compare = mc
    ? [
        { name: "Reflexive", value: mc.medianTerminalWealth, fill: OX },
        { name: "Counterfactual", value: mc.medianCounterfactualWealth, fill: NAVY },
      ]
    : [];

  function runMc() {
    setRunning(true);
    setProgress(0);
    setMc(null);
    const monthsToDischarge: number[] = [];
    const refW: number[] = [];
    const cfW: number[] = [];
    const total = 1_000;
    let i = 0;
    function step() {
      const end = Math.min(total, i + 20);
      for (; i < end; i++) {
        const one = runReflexOnce(shared, params, MASTER_SEED + 17 + i);
        monthsToDischarge.push(one.dischargeMonth ?? HORIZON + 12);
        refW.push(one.refW);
        cfW.push(one.cfW);
      }
      setProgress(i);
      if (i < total) {
        window.setTimeout(step, 0);
        return;
      }
      setMc(summarizeReflexMc(monthsToDischarge, refW, cfW));
      setRunning(false);
    }
    window.setTimeout(step, 30);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section ref={rootRef} className="space-y-6">
        <TabHeader
          kicker="Tab 7 · Reflexivity loop"
          text={headline}
          filename="reflexivity-loop.png"
          targetRef={rootRef}
        />

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3">
          <Stat
            label="Pre-discharge Sharpe"
            value={pre.toFixed(2)}
            tone={pre > 0.8 ? "oxblood" : "win"}
            hint={pre > 0.8 ? "The metric gave no warning" : undefined}
          />
          <Stat
            label="Alpha at discharge"
            value={result.dischargeMonth ? formatPct(result.preDischargeAlpha) : "—"}
            tone="oxblood"
          />
          <Stat label="Survivors" value={`${result.survivors} / 100`} />
        </div>

        <div>
          <h3 className="text-muted mb-3 font-ui text-sm font-medium tracking-kicker uppercase">
            System dynamics — 240 months
          </h3>
          <div className="h-72 rounded-md bg-surface pt-2 shadow-[var(--shadow-border)] md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={result.months} margin={{ top: 8, right: 12, left: -8, bottom: 8 }}>
                <CartesianGrid stroke={LINE} vertical={false} />
                <XAxis dataKey="month" tick={CHART_TICK} />
                <YAxis yAxisId="l" tick={CHART_TICK} tickFormatter={(v) => formatChartNum(Number(v), 1)} />
                <YAxis
                  yAxisId="r"
                  orientation="right"
                  tick={CHART_TICK}
                  tickFormatter={(v) => `$${formatChartNum(Number(v), 0)}B`}
                />
                <Tooltip cursor={{ fill: "rgba(28,28,28,0.04)" }} content={<ChartTip format={(n) => formatChartNum(n, 2)} />} />
                <Legend wrapperStyle={{ fontSize: 13, fontFamily: "IBM Plex Sans, sans-serif" }} />
                {result.dischargeMonth ? (
                  <ReferenceArea
                    yAxisId="l"
                    x1={result.dischargeMonth - 1}
                    x2={result.dischargeMonth + 1}
                    fill={OX}
                    fillOpacity={0.12}
                  />
                ) : null}
                <Line
                  yAxisId="l"
                  type="monotone"
                  dataKey="sharpe"
                  name="Trailing Sharpe"
                  stroke={NAVY}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="l"
                  type="monotone"
                  dataKey="alpha"
                  name="System alpha"
                  stroke={GOLD}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="l"
                  type="monotone"
                  dataKey="gamma"
                  name="Stored gamma"
                  stroke={OX}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="r"
                  type="monotone"
                  dataKey="assets"
                  name="Total assets ($B)"
                  stroke={MUTED}
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
                {p.showCounterfactual ? (
                  <Line
                    yAxisId="r"
                    type="monotone"
                    dataKey="cfAssets"
                    name="Counterfactual AUM"
                    stroke={NAVY}
                    strokeDasharray="2 3"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                ) : null}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-muted mt-2 text-sm">
            Watch the red line (stored gamma) climb while the dark line (Sharpe) stays flat. That gap is the system
            lying to itself. The red band is when it stops.
          </p>
        </div>

        <div className="no-export flex flex-wrap items-center gap-3">
          <Button onClick={runMc} disabled={running}>
            <Play className="size-3.5" />
            {running ? `Running… ${progress}/1,000` : "Run 1,000 simulations"}
          </Button>
        </div>

        {mc ? (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-muted mb-3 font-ui text-sm font-medium tracking-kicker uppercase">
                  Months to first discharge — 1,000 runs
                </h3>
                <div className="h-40 rounded-md bg-surface pt-2 shadow-[var(--shadow-border)] md:h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mc.histogram} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
                      <CartesianGrid stroke={LINE} vertical={false} />
                      <XAxis
                        dataKey="x"
                        tick={CHART_TICK}
                        tickFormatter={(v) => (Number(v) > 240 ? "None" : String(v))}
                      />
                      <YAxis tick={CHART_TICK} />
                      <Tooltip cursor={{ fill: "rgba(28,28,28,0.04)" }} content={<ChartTip format={(n) => formatChartNum(n, 0)} />} />
                      <Bar dataKey="n" name="Runs" fill={NAVY} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <h3 className="text-muted mb-3 font-ui text-sm font-medium tracking-kicker uppercase">
                  Median terminal wealth — reflexive vs. counterfactual
                </h3>
                <div className="h-40 rounded-md bg-surface pt-2 shadow-[var(--shadow-border)] md:h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={compare} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                      <XAxis type="number" tick={CHART_TICK} tickFormatter={(v) => `$${formatChartNum(Number(v), 0)}B`} />
                      <YAxis type="category" dataKey="name" width={120} tick={{ ...CHART_TICK, fill: NAVY }} />
                      <Tooltip cursor={{ fill: "rgba(28,28,28,0.04)" }} content={<ChartTip format={(n) => `$${formatChartNum(n, 1)}B`} />} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={22} isAnimationActive={false}>
                        {compare.map((e) => (
                          <Cell key={e.name} fill={e.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <p className="text-muted text-sm">
              The counterfactual uses the same returns with no crowding and no discharge. The gap between the two bars is
              the cost of the reflexive loop.
            </p>
          </>
        ) : null}
      </section>

      <aside className="space-y-4 rounded-lg bg-cream p-5">
        <h3 className="font-display text-title font-medium text-navy">Reflexivity</h3>
        <Field
          label="Baseline alpha"
          value={p.baselineAlpha}
          min={0}
          max={8}
          step={0.5}
          onChange={(v) => p.setParam("baselineAlpha", v)}
          format={(v) => formatPct(v)}
        />
        <Field
          label="Capacity ($B)"
          value={p.capacityConstant}
          min={50}
          max={500}
          step={25}
          onChange={(v) => p.setParam("capacityConstant", v)}
          format={(v) => `$${v}B`}
        />
        <Field
          label="Flow sensitivity"
          value={p.flowSensitivity}
          min={0}
          max={0.1}
          step={0.005}
          onChange={(v) => p.setParam("flowSensitivity", v)}
          format={(v) => v.toFixed(3)}
        />
        <Field
          label="Flow convexity"
          value={p.flowConvexity}
          min={1}
          max={4}
          step={0.5}
          onChange={(v) => p.setParam("flowConvexity", v)}
          format={(v) => v.toFixed(1)}
        />
        <Field
          label="Gamma accrual"
          value={p.gammaAccrual}
          min={0.001}
          max={0.02}
          step={0.001}
          onChange={(v) => p.setParam("gammaAccrual", v)}
          format={(v) => v.toFixed(3)}
        />
        <Field
          label="Discharge sensitivity"
          value={p.dischargeSensitivity}
          min={0.1}
          max={2}
          step={0.1}
          onChange={(v) => p.setParam("dischargeSensitivity", v)}
          format={(v) => v.toFixed(2)}
        />
        <Field
          label="Discharge severity"
          value={p.dischargeSeverity}
          min={1}
          max={5}
          step={0.5}
          onChange={(v) => p.setParam("dischargeSeverity", v)}
          format={(v) => v.toFixed(1)}
        />
        <Toggle
          label="Show counterfactual"
          value={p.showCounterfactual}
          onChange={(v) => p.setParam("showCounterfactual", v)}
          yes="On"
          no="Off"
        />
        <p className="text-muted text-sm leading-relaxed">
          100 managers, 240 months. Capital flows convex in trailing 36-month Sharpe. Alpha decays with aggregate
          assets. Stored gamma discharges simultaneously. Seed {MASTER_SEED}.
        </p>
      </aside>
    </div>
  );
}


