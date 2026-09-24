import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Field, SelectField } from "@/components/field";
import { TabHeader, Stat } from "@/components/headline";
import { ChartTip } from "@/components/charts/chart-tip";
import {
  distLabel,
  runEstimator,
  sweepTrackRecord,
  type SweepPoint,
} from "@/lib/calc/estimator";
import { MASTER_SEED } from "@/lib/calc/rng";
import type { ReturnDist } from "@/lib/calc/types";
import { CHART_TICK, GOLD, LINE, MUTED, NAVY, OX, PAPER, CHART_LEGEND } from "@/lib/palette";
import { formatChartNum } from "@/lib/utils";
import { useParams } from "@/store/use-params";

const DIST_OPTIONS: { value: ReturnDist; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "skew-normal", label: "Skew-normal (α = −3)" },
  { value: "student-t", label: "Student-t (df = 5)" },
];

function nearest(sweep: SweepPoint[], months: number) {
  return sweep.reduce((b, p) => (Math.abs(p.months - months) < Math.abs(b.months - months) ? p : b), sweep[0]);
}

export function EstimatorTab() {
  const p = useParams();
  const rootRef = useRef<HTMLElement>(null);
  const params = {
    trackRecord: p.trackRecord,
    screenThreshold: p.screenThreshold,
    trueSharpeM: p.trueSharpeM,
    trueSharpeS: p.trueSharpeS,
    returnDist: p.returnDist,
  };
  const shared = { equityVol: p.equityVol, riskFree: p.riskFree };

  const result = useMemo(
    () => runEstimator(params, shared),
    [p.trackRecord, p.screenThreshold, p.trueSharpeM, p.trueSharpeS, p.returnDist, p.equityVol, p.riskFree],
  );
  const [sweep, setSweep] = useState<SweepPoint[] | null>(null);
  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      setSweep(sweepTrackRecord(params, shared));
    });
    return () => window.cancelAnimationFrame(id);
  }, [p.screenThreshold, p.trueSharpeM, p.trueSharpeS, p.equityVol, p.riskFree]);
  const point = sweep ? nearest(sweep, p.trackRecord) : undefined;
  const activeFpr =
    p.returnDist === "normal" ? point?.normalFPR : p.returnDist === "student-t" ? point?.studentFPR : point?.skewFPR;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section ref={rootRef} className="space-y-6">
        <TabHeader
          kicker="Tab 6 · Estimator convergence"
          text={`${result.falsePositiveRate.toFixed(0)}% of selected managers have true Sharpe below 0.50`}
          filename="estimator-convergence.png"
          targetRef={rootRef}
        />

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3">
          <Stat label="Passed screen" value={`${result.selected} of 1,000`} />
          <Stat
            label="Median true Sharpe"
            value={result.selected ? result.medianTrueSharpe.toFixed(2) : "—"}
            tone={result.medianTrueSharpe >= 0.5 ? "gold" : "oxblood"}
          />
          <Stat
            label="False positive rate"
            value={`${result.falsePositiveRate.toFixed(0)}%`}
            tone="oxblood"
            hint="True Sharpe < 0.50"
          />
        </div>

        <div>
          <h3 className="text-muted mb-3 font-ui text-sm font-medium tracking-kicker uppercase">
            False-positive rate vs. track-record length
          </h3>
          <div className="h-56 rounded-md bg-surface pt-2 shadow-[var(--shadow-border)] md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sweep ?? []} margin={{ top: 8, right: 8, left: -12, bottom: 28 }}>
                <CartesianGrid stroke={LINE} vertical={false} />
                <XAxis dataKey="months" tick={CHART_TICK} />
                <YAxis tick={CHART_TICK} tickFormatter={(v) => `${formatChartNum(Number(v), 0)}%`} />
                <Tooltip cursor={{ fill: "rgba(28,28,28,0.04)" }} content={<ChartTip format={(n) => `${formatChartNum(n, 1)}%`} />} />
                <Legend iconSize={CHART_LEGEND.iconSize} wrapperStyle={CHART_LEGEND.wrapperStyle} />
                <ReferenceLine
                  x={60}
                  stroke={GOLD}
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{ value: "5-yr record", fill: MUTED, fontSize: 10, position: "insideTopRight" }}
                />
                <ReferenceLine
                  x={72}
                  stroke={GOLD}
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{ value: "CIO tenure", fill: MUTED, fontSize: 10, position: "insideTopLeft" }}
                />
                <ReferenceLine x={p.trackRecord} stroke={NAVY} strokeDasharray="2 2" />
                <Line
                  type="monotone"
                  dataKey="normalFPR"
                  name="Normal"
                  stroke={MUTED}
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="skewFPR"
                  name="Skew-normal"
                  stroke={NAVY}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="studentFPR"
                  name="Student-t"
                  stroke={OX}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                {point && activeFpr !== undefined ? (
                  <ReferenceDot x={point.months} y={activeFpr} r={5} fill={NAVY} stroke={PAPER} />
                ) : null}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-muted mt-2 text-sm">
            Move the track-record slider right and watch the false-positive rate drop — that's how long it takes for the
            screen to actually work.
          </p>
        </div>

        <div>
          <h3 className="text-muted mb-3 font-ui text-sm font-medium tracking-kicker uppercase">
            True Sharpe distribution — selected managers
          </h3>
          <div className="h-40 rounded-md bg-surface pt-2 shadow-[var(--shadow-border)] md:h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={result.trueDistribution} margin={{ top: 16, right: 8, left: -12, bottom: 8 }}>
                <CartesianGrid stroke={LINE} vertical={false} />
                <XAxis
                  dataKey="bin"
                  type="number"
                  domain={[-0.5, 3]}
                  tick={CHART_TICK}
                  tickFormatter={(v) => formatChartNum(Number(v), 1)}
                />
                <YAxis tick={CHART_TICK} />
                <Tooltip cursor={{ fill: "rgba(28,28,28,0.04)" }} content={<ChartTip format={(n) => formatChartNum(n, 0)} />} />
                <ReferenceLine
                  x={0.5}
                  stroke={OX}
                  strokeDasharray="4 4"
                  label={{ value: "0.50", fill: MUTED, fontSize: 10, position: "top" }}
                />
                <ReferenceLine
                  x={p.screenThreshold}
                  stroke={GOLD}
                  strokeDasharray="4 4"
                  label={{ value: "Screen", fill: MUTED, fontSize: 10, position: "top" }}
                />
                <Bar dataKey="count" name="Managers" fill={NAVY} maxBarSize={18} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-muted mt-2 text-sm">
            The gold line is your screen. Everything to its left passed — and the red line shows how many of them are
            below a true Sharpe of 0.50.
          </p>
        </div>
      </section>

      <aside className="space-y-4 rounded-lg bg-cream p-5">
        <h3 className="font-display text-title font-medium text-navy">Estimator</h3>
        <Field
          label="Track record"
          value={p.trackRecord}
          min={24}
          max={240}
          step={6}
          onChange={(v) => p.setParam("trackRecord", v)}
          format={(v) => `${v} mo`}
        />
        <Field
          label="Screen threshold"
          value={p.screenThreshold}
          min={0.5}
          max={3}
          step={0.1}
          onChange={(v) => p.setParam("screenThreshold", v)}
          format={(v) => v.toFixed(2)}
        />
        <Field
          label="True Sharpe mean"
          value={p.trueSharpeM}
          min={-0.2}
          max={0.8}
          step={0.05}
          onChange={(v) => p.setParam("trueSharpeM", v)}
          format={(v) => v.toFixed(2)}
        />
        <Field
          label="True Sharpe std dev"
          value={p.trueSharpeS}
          min={0.1}
          max={0.6}
          step={0.05}
          onChange={(v) => p.setParam("trueSharpeS", v)}
          format={(v) => v.toFixed(2)}
        />
        <SelectField
          label="Return distribution"
          value={p.returnDist}
          options={DIST_OPTIONS}
          onChange={(v) => p.setParam("returnDist", v)}
        />
        <p className="text-muted text-sm leading-relaxed">
          1,000 managers. True Sharpe drawn from N({p.trueSharpeM.toFixed(2)}, {p.trueSharpeS.toFixed(2)}). Monthly
          returns from {distLabel(p.returnDist)}. Default screen is 1.50 — at these priors that is an 80%
          false-positive rate. A screen of 2.00 selects nobody. Seed {MASTER_SEED}.
        </p>
      </aside>
    </div>
  );
}

